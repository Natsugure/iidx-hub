import prisma from '@iidx-hub/database';
import { type ChartUncheckedCreateInput, type SongUncheckedCreateInput } from '@iidx-hub/database/src/generated/prisma/models';
import { PlayStyle, Difficulty } from '@iidx-hub/database/src/generated/prisma/enums';
import { fetchTextageActblData, SongData } from '@/scrapers/textage-actbl-scraper';
import { fetchAndParseTitletbl, TextageSong } from '@/scrapers/textage-titletbl-scraper';
import { 
  fetchTextageDataTblData, 
  getNotesForChart, 
  getBpmForChart,
  DatatblEntry 
} from '@/scrapers/textage-datatbl-scraper';

type IntegrationResult = {
  songsAdded: number;
  songsUpdated: number;
  chartsAdded: number;
  chartsUpdated: number;
  errors: string[];
};

/**
 * textage.cc のデータを統合してDBに保存
 */
export async function integrateTextageData(): Promise<IntegrationResult> {
  const result: IntegrationResult = {
    songsAdded: 0,
    songsUpdated: 0,
    chartsAdded: 0,
    chartsUpdated: 0,
    errors: [],
  };

  try {
    console.log('Fetching data from textage.cc...');
    
    const [actblData, titletblData, datatblData] = await Promise.all([
      fetchTextageActblData(true),
      fetchAndParseTitletbl(),
      fetchTextageDataTblData(),
    ]);

    console.log(`Fetched ${actblData.length} songs from actbl.js`);
    console.log(`Fetched ${titletblData.length} songs from titletbl.js`);
    console.log(`Fetched ${datatblData.size} songs from datatbl.js`);

    const titletblMap = new Map<string, TextageSong>();
    titletblData.forEach(song => {
      titletblMap.set(song.songId, song);
    });

    for (const actblSong of actblData) {
      try {
        const titleInfo = titletblMap.get(actblSong.tag);
        const datatblInfo = datatblData.get(actblSong.tag);
        
        if (!titleInfo) {
          result.errors.push(`Title info not found for ${actblSong.tag}`);
          continue;
        }

        await upsertSongWithCharts(actblSong, titleInfo, datatblInfo, result);
      } catch (error) {
        const errorMsg = `Failed to process ${actblSong.tag}: ${error}`;
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

async function upsertSongWithCharts(
  actblSong: SongData,
  titleInfo: TextageSong,
  datatblInfo: DatatblEntry | undefined,
  result: IntegrationResult
): Promise<void> {

  const existingSong = await prisma.song.findUnique({
    where: { textageSlug: actblSong.tag },
  });

  const songData: SongUncheckedCreateInput = {
    textageSlug: actblSong.tag,
    textageNumIndex: titleInfo.textageId,
    title: `${titleInfo.title}${titleInfo.subtitle ?? ''}`,
    genre: titleInfo.genre,
    artist: titleInfo.artist,
    versionId: titleInfo.version,
    isInAC: actblSong.isInAC,
    isInINFINITAS: actblSong.isInINFINITAS,
  }

  const song = await prisma.song.upsert({
    where: { textageSlug: actblSong.tag },
    update: songData,
    create: songData,
  });

  if (existingSong) {
    result.songsUpdated++;
  } else {
    result.songsAdded++;
  }

  const charts = [
    { playStyle: 'SP' as PlayStyle, difficulty: 'BEGINNER' as Difficulty, data: actblSong.spBeginner },
    { playStyle: 'SP' as PlayStyle, difficulty: 'NORMAL' as Difficulty, data: actblSong.spNormal },
    { playStyle: 'SP' as PlayStyle, difficulty: 'HYPER' as Difficulty, data: actblSong.spHyper },
    { playStyle: 'SP' as PlayStyle, difficulty: 'ANOTHER' as Difficulty, data: actblSong.spAnother },
    { playStyle: 'SP' as PlayStyle, difficulty: 'LEGGENDARIA' as Difficulty, data: actblSong.spLeggendaria },
    { playStyle: 'DP' as PlayStyle, difficulty: 'NORMAL' as Difficulty, data: actblSong.dpNormal },
    { playStyle: 'DP' as PlayStyle, difficulty: 'HYPER' as Difficulty, data: actblSong.dpHyper },
    { playStyle: 'DP' as PlayStyle, difficulty: 'ANOTHER' as Difficulty, data: actblSong.dpAnother },
    { playStyle: 'DP' as PlayStyle, difficulty: 'LEGGENDARIA' as Difficulty, data: actblSong.dpLeggendaria },
  ];

  for (const chart of charts) {
    if (chart.data.level === null) {
      continue;
    }

    try {
      const existingChart = await prisma.chart.findUnique({
        where: {
          songId_playStyle_difficulty: {
            songId: song.id,
            playStyle: chart.playStyle,
            difficulty: chart.difficulty,
          },
        },
      });

      // datatbl.jsからノーツ数とBPMを取得
      let totalNotes: number | undefined;
      let bpm: string | undefined;
      
      if (datatblInfo) {
        totalNotes = getNotesForChart(datatblInfo, chart.playStyle, chart.difficulty);
        bpm = getBpmForChart(datatblInfo, chart.playStyle, chart.difficulty);
        
        // ノーツ数が0の場合はnullとして扱う
        if (totalNotes === 0) {
          totalNotes = undefined;
        }
      }

      const chartData: ChartUncheckedCreateInput = {
        songId: song.id,
        playStyle: chart.playStyle,
        difficulty: chart.difficulty,
        level: chart.data.level,
        notes: totalNotes,
        bpm: bpm,
      };

      await prisma.chart.upsert({
        where: {
          songId_playStyle_difficulty: {
            songId: song.id,
            playStyle: chart.playStyle,
            difficulty: chart.difficulty,
          },
        },
        update: chartData,
        create: chartData,
      });

      if (existingChart) {
        result.chartsUpdated++;
      } else {
        result.chartsAdded++;
      }
    } catch (error) {
      console.error(`Failed to upsert chart for ${actblSong.tag} ${chart.playStyle} ${chart.difficulty}:`, error);
    }
  }
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
      songsFound: result ? result.songsAdded + result.songsUpdated : undefined,
      songsAdded: result?.songsAdded,
      songsUpdated: result?.songsUpdated,
      errorMessage,
    },
  });
}