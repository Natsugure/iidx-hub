import axios from 'axios';
import * as fs from 'fs';

const JSON_URL = 'https://iidx-sp12.github.io/songs.json';

async function inspectJSON() {
  console.log(`📥 Fetching ${JSON_URL}...`);
  
  try {
    const response = await axios.get(JSON_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    
    const data = response.data;
    
    // ファイルに保存
    fs.writeFileSync('songs.json', JSON.stringify(data, null, 2));
    console.log('✅ Saved JSON to songs.json\n');
    
    console.log('📊 JSON Structure:');
    console.log('---');
    console.log(`Total items: ${data.length}`);
    
    // 最初の3件を表示
    console.log('\n📋 First 3 items:');
    data.slice(0, 3).forEach((item: any, index: number) => {
      console.log(`\nItem ${index + 1}:`);
      console.log(JSON.stringify(item, null, 2));
    });
    
    // フィールド名を確認
    if (data.length > 0) {
      console.log('\n🔑 Available fields:');
      console.log(Object.keys(data[0]));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

inspectJSON().catch(console.error);