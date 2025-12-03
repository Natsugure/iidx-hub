import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const JSON_URL = 'https://iidx-sp12.github.io/songs.json';

interface SongData {
  name: string;
  difficulty: string;
  normal: string;
  hard: string;
  version: string;
  d_value: number; // HYPERが1、ANOTHERが2、LEGGENDARIAが3
  n_value: number;
  h_value: number;
}

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
function normalizeDifficulty(difficultyText: string): string {
  const normalized = difficultyText.toUpperCase().trim();
  
  if (normalized === 'L') return 'LEGGENDARIA';
  if (normalized === 'A') return 'ANOTHER';
  if (normalized === 'H') return 'HYPER';
  
  return normalized;
}

/**
 * データベースを更新
 */
async function updateDatabase(songsData: SongData[]): Promise<void> {
  console.log('\n💾 Updating database...');
  
  let updatedCount = 0;
  let notFoundCount = 0;
  let createdCount = 0;
  
  for (const data of songsData) {
    try {
      const difficulty = normalizeDifficulty(data.difficulty);
      
      // 楽曲名で検索（前後の空白を削除して検索）
      const songName = data.name.trim();
      
      const song = await prisma.song.findFirst({
        where: {
          OR: [
            { title: { equals: songName, mode: 'insensitive' } }
            // { title: { contains: songName, mode: 'insensitive' } },
          ],
        },
      });
      
      if (!song) {
        console.log(`⚠️  Song not found in DB: ${songName}`);
        notFoundCount++;
        continue;
      }
      
      // 譜面を更新（SP ANOTHER など）
      const updated = await prisma.chart.updateMany({
        where: {
          songId: song.id,
          playStyle: 'SP',
          difficulty: difficulty,
        },
        data: {
          unofficialLevel: data.normal, // ノマゲ難易度を保存
        },
      });
      
      if (updated.count > 0) {
        console.log(`✅ Updated: ${song.title} [${difficulty}] → ${data.normal}`);
        updatedCount++;
      } else {
        // 譜面が存在しない場合は作成（オプション）
        console.log(`ℹ️  Chart not found for: ${song.title} [${difficulty}]`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${data.name}:`, error);
    }
  }
  
  console.log(`\n📊 Update summary:`);
  console.log(`   ✅ Updated: ${updatedCount}`);
  console.log(`   ⚠️  Not found in DB: ${notFoundCount}`);
  console.log(`   📝 Total processed: ${songsData.length}`);
  
  // 更新履歴を記録
  await prisma.difficultyTableUpdate.create({
    data: {
      success: true,
      message: `Updated ${updatedCount} charts, ${notFoundCount} songs not found`,
    },
  });
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 Starting JSON-based difficulty table scraper...\n');
  
  try {
    // 1. JSONを取得
    const songsData = await fetchSongsJSON();
    
    if (songsData.length === 0) {
      console.log('⚠️  No songs found in JSON.');
      return;
    }
    
    // 2. サンプルデータを表示
    console.log('\n📋 Sample data (first 3):');
    songsData.slice(0, 3).forEach(song => {
      console.log(`   ${song.name} [${song.difficulty}] - Normal: ${song.normal}, Hard: ${song.hard}`);
    });
    
    // 3. データベース更新
    await updateDatabase(songsData);
    
    console.log('\n✨ Scraping completed successfully!');
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    
    // エラーログを記録
    await prisma.difficultyTableUpdate.create({
      data: {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
main();