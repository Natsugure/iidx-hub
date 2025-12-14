import axios from 'axios';
import prisma from '@iidx-hub/database';
import { Difficulty } from '@iidx-hub/database/src/generated/prisma/enums';

const JSON_URL = 'https://iidx-sp12.github.io/songs.json';

type SongData = {
  name: string;
  difficulty: string;
  normal: string;
  hard: string;
  version: string;
  d_value: number;
  n_value: number;
  h_value: number;
};

type IntegrationResult = {
  chartsUpdated: number;
  songsNotFound: number;
  invalidDifficulties: number;
  errors: string[];
};

/**
 * songs.json を取得
 */ 
async function fetchSongsJSON(): Promise<SongData[]> {
  console.log(`📥 Fetching ${JSON_URL}...`);
  
  try {
    const response = await axios.get<SongData[]>(JSON_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      timeout: 10000,
    });
    
    console.log(`✅ Successfully fetched ${response.data.length} songs`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching songs.json:', error);
    throw error;
  }
}

/**
 * 難易度名を正規化
 */
function normalizeDifficulty(difficultyText: string): Difficulty | null {
  const normalized = difficultyText.toUpperCase().trim();

  const shortFormMap: Record<string, Difficulty> = {
    'L': Difficulty.LEGGENDARIA,
    'A': Difficulty.ANOTHER,
    'H': Difficulty.HYPER,
    'N': Difficulty.NORMAL,
    'B': Difficulty.BEGINNER,
  };
  
  if (shortFormMap[normalized]) return shortFormMap[normalized];
  
  return null;
}

/**
 * SP12非公式難易度表のデータを統合してDBに保存
 */
export async function integrateUnofficialDifficulty(): Promise<IntegrationResult> {
  const result: IntegrationResult = {
    chartsUpdated: 0,
    songsNotFound: 0,
    invalidDifficulties: 0,
    errors: [],
  };

  try {
    console.log('Fetching unofficial difficulty data from SP12...');
    
    const songsData = await fetchSongsJSON();
    
    if (songsData.length === 0) {
      throw new Error('No songs found in JSON');
    }

    console.log(`Fetched ${songsData.length} difficulty entries from SP12`);

    // サンプルデータを表示
    console.log('\n📋 Sample data (first 3):');
    songsData.slice(0, 3).forEach(song => {
      console.log(`   ${song.name} [${song.difficulty}] - Normal: ${song.normal}, Hard: ${song.hard}`);
    });

    // 各エントリを処理
    for (const data of songsData) {
      try {
        await updateChartDifficulty(data, result);
      } catch (error) {
        const errorMsg = `Failed to process ${data.name} [${data.difficulty}]: ${error}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    console.log('Integration completed:', result);
    return result;

  } catch (error) {
    console.error('Integration failed:', error);
    throw error;
  }
}

/**
 * 譜面の非公式難易度を更新
 */
async function updateChartDifficulty(
  data: SongData,
  result: IntegrationResult
): Promise<void> {
  const difficulty = normalizeDifficulty(data.difficulty);

if (difficulty === null) {
    console.log(`⚠️  Invalid difficulty: ${data.difficulty} for ${data.name}`);
    result.invalidDifficulties++;
    return;
  }

  const songName = data.name.trim();
  
  // 楽曲を検索
  const song = await prisma.song.findFirst({
    where: {
      OR: [
        { title: { equals: songName, mode: 'insensitive' } },
        // 必要に応じて部分一致検索も有効化
        // { title: { contains: songName, mode: 'insensitive' } },
      ],
    },
  });
  
  if (!song) {
    console.log(`⚠️  Song not found in DB: ${songName}`);
    result.songsNotFound++;
    return;
  }
  
  // 譜面を更新
  const updated = await prisma.chart.update({
    where: {
        songId_playStyle_difficulty: {
          songId: song.id,
          playStyle: 'SP',
          difficulty: difficulty,
        },
      },
    data: {
      unofficialClearLevel: data.normal,
      unofficialHardLevel: data.hard,
    },
  });
  
    console.log(`✅ Updated: ${song.title} [${difficulty}] → ${data.normal}`);
    result.chartsUpdated++;
}

/**
 * スクレイピング実行を記録
 */
export async function recordScraperRun(
  source: string,
  success: boolean,
  result?: IntegrationResult,
  errorMessage?: string
): Promise<void> {
  await prisma.scraperRun.create({
    data: {
      source,
      success,
      completedAt: new Date(),
      songsFound: result ? result.chartsUpdated + result.songsNotFound : undefined,
      songsUpdated: result?.chartsUpdated,
      errorMessage,
    },
  });
}