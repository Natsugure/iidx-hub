/**
 * textage.ccから実際にデータを取得してテストするスクリプト
 * 
 * 実行方法:
 * cd packages/scraper
 * pnpm test:parser
 */

import { fetchAndParseTitletbl } from '../src/textage-titletbl-parser';

async function main() {
  console.log('='.repeat(60));
  console.log('textage.cc Parser Test - Real Data');
  console.log('='.repeat(60));
  console.log('');

  try {
    console.log('🌐 Fetching data from textage.cc...\n');
    
    const songs = await fetchAndParseTitletbl();
    
    console.log('='.repeat(60));
    console.log(`✅ Successfully fetched ${songs.length} songs!`);
    console.log('='.repeat(60));
    console.log('');

    // 最初の10曲を表示
    console.log('📋 First 10 songs:\n');
    songs.slice(0, 10).forEach((song, index) => {
      console.log(`${index + 1}. [${song.songId}]`);
      console.log(`   Title: ${song.title}`);
      console.log(`   Artist: ${song.artist}`);
      console.log(`   Genre: ${song.genre}`);
      console.log(`   Version: ${song.version}`);
      console.log(`   Textage ID: ${song.textageId}`);
      if (song.rawTitle !== song.title) {
        console.log(`   Raw Title: ${song.rawTitle}`);
      }
      console.log('');
    });

    // 統計情報
    console.log('='.repeat(60));
    console.log('📊 Statistics:');
    console.log('='.repeat(60));
    
    // バージョンごとの楽曲数
    const versionCounts = songs.reduce((acc, song) => {
      acc[song.version] = (acc[song.version] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    console.log('\n📈 Songs by version:');
    Object.entries(versionCounts)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([version, count]) => {
        console.log(`   Version ${version}: ${count} songs`);
      });

    // ジャンルの種類
    const genres = new Set(songs.map(s => s.genre).filter(Boolean));
    console.log(`\n🎵 Total genres: ${genres.size}`);
    
    // サンプルジャンル
    console.log('\n🎨 Sample genres:');
    Array.from(genres).slice(0, 10).forEach(genre => {
      console.log(`   - ${genre}`);
    });

    // HTML装飾があるタイトル
    const htmlTitles = songs.filter(s => s.rawTitle !== s.title);
    if (htmlTitles.length > 0) {
      console.log(`\n✨ Songs with HTML formatting: ${htmlTitles.length}`);
      console.log('\nExamples:');
      htmlTitles.slice(0, 5).forEach(song => {
        console.log(`   - ${song.title}`);
        console.log(`     Raw: ${song.rawTitle}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error(error);
    process.exit(1);
  }
}

// 実行
main();