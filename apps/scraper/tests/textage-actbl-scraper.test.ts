// tests/textage-actbl-scraper.test.ts
import { fetchTextageActblData, SongData } from '../src/textage-actbl-scraper';

/**
 * textage actbl スクレイパーのテスト
 */
async function testTextageActblScraper() {
  console.log('=== Testing Textage actbl Scraper ===\n');
  
  try {
    // AC版収録曲を取得
    const songs = await fetchTextageActblData(true);
    
    console.log(`\n✓ Successfully fetched ${songs.length} songs\n`);
    
    // サンプル: 最初の5曲を詳細表示
    console.log('=== Sample: First 5 songs ===');
    songs.slice(0, 5).forEach(song => {
      console.log('\n---');
      console.log(`Tag: ${song.tag}`);
      console.log(`AC: ${song.isInAC}, INFINITAS: ${song.isInINFINITAS}`);
      console.log(`Has Beginner: ${song.hasBeginner}, Has Leggendaria: ${song.hasLeggendaria}`);
      console.log('\nSP Charts:');
      if (song.spBeginner.level) {
        console.log(`  BEGINNER: Lv.${song.spBeginner.level} (${song.spBeginner.hasChartData ? 'exists' : 'no data'})`);
      }
      console.log(`  NORMAL: Lv.${song.spNormal.level ?? 'N/A'} (${song.spNormal.hasChartData ? 'exists' : 'no data'})`);
      console.log(`  HYPER: Lv.${song.spHyper.level ?? 'N/A'} (${song.spHyper.hasChartData ? 'exists' : 'no data'})`);
      console.log(`  ANOTHER: Lv.${song.spAnother.level ?? 'N/A'} (${song.spAnother.hasChartData ? 'exists' : 'no data'})`);
      if (song.hasLeggendaria && song.spLeggendaria.level) {
        console.log(`  LEGGENDARIA: Lv.${song.spLeggendaria.level}`);
      }
    });
    
    // 統計情報
    console.log('\n=== Statistics ===');
    const withLeggendaria = songs.filter(s => s.hasLeggendaria).length;
    const withBeginner = songs.filter(s => s.hasBeginner).length;
    const inINFINITAS = songs.filter(s => s.isInINFINITAS).length;
    
    console.log(`Songs with LEGGENDARIA: ${withLeggendaria}`);
    console.log(`Songs with BEGINNER: ${withBeginner}`);
    console.log(`Songs in INFINITAS: ${inINFINITAS}`);
    
    // レベル別集計 (SP ANOTHER)
    const levelCounts = new Map<number, number>();
    songs.forEach(song => {
      if (song.spAnother.level) {
        levelCounts.set(
          song.spAnother.level,
          (levelCounts.get(song.spAnother.level) || 0) + 1
        );
      }
    });
    
    console.log('\n=== SP ANOTHER Level Distribution ===');
    Array.from(levelCounts.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([level, count]) => {
        console.log(`  Level ${level}: ${count} songs`);
      });
    
    // CN/BSS譜面の数
    const withCNorBSS = songs.filter(s => 
      s.spNormal.hasCNorBSS || 
      s.spHyper.hasCNorBSS || 
      s.spAnother.hasCNorBSS ||
      s.spLeggendaria.hasCNorBSS
    ).length;
    console.log(`\nSongs with CN/BSS (SP): ${withCNorBSS}`);
    
    // データ検証
    console.log('\n=== Data Validation ===');
    let validationErrors = 0;
    
    songs.forEach(song => {
      // 全ての楽曲がAC版に収録されているはず
      if (!song.isInAC) {
        console.error(`✗ ${song.tag}: isInAC should be true`);
        validationErrors++;
      }
      
      // Leggendariaフラグが立っていればレベルが設定されているはず
      if (song.hasLeggendaria && song.spLeggendaria.level === null) {
        console.error(`✗ ${song.tag}: hasLeggendaria is true but level is null`);
        validationErrors++;
      }
    });
    
    if (validationErrors === 0) {
      console.log('✓ All validation checks passed');
    } else {
      console.log(`✗ Found ${validationErrors} validation errors`);
    }
    
    // サンプルデータをJSON出力
    console.log('\n=== Sample JSON Output (first song) ===');
    console.log(JSON.stringify(songs[0], null, 2));
    
    console.log('\n=== Test completed successfully ===');
    return songs;
    
  } catch (error) {
    console.error('\n✗ Test failed:', error);
    throw error;
  }
}

// テスト実行
if (require.main === module) {
  testTextageActblScraper()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { testTextageActblScraper };