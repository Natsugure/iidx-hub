import { integrateTextageData, recordScraperRun } from '../src/services/song-integration.service';
import prisma from '@iidx-hub/database';

async function main() {
  console.log('=== Starting Textage Data Integration Test ===\n');
  
  const startTime = Date.now();
  try {
    // 統合処理を実行
    const result = await integrateTextageData();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n=== Integration Results ===');
    console.log(`Duration: ${duration}s`);
    console.log(`Songs added: ${result.songsAdded}`);
    console.log(`Songs updated: ${result.songsUpdated}`);
    console.log(`Charts added: ${result.chartsAdded}`);
    console.log(`Charts updated: ${result.chartsUpdated}`);
    
    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors (${result.errors.length}):`);
      result.errors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more errors`);
      }
    }
    
    // スクレイピング実行を記録
    await recordScraperRun('textage.cc', true, result);
    console.log('\n✓ Scraper run recorded in database');
    
    console.log('\n=== Test completed successfully ===');
    process.exit(0);
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.error('\n=== Integration Failed ===');
    console.error(`Duration: ${duration}s`);
    console.error('Error:', error);
    
    // エラーを記録
    try {
      await recordScraperRun(
        'textage.cc',
        false,
        undefined,
        error instanceof Error ? error.message : String(error)
      );
      console.log('\n✓ Error recorded in database');
    } catch (recordError) {
      console.error('Failed to record error:', recordError);
    }
    
    process.exit(1);
  }
}

main();