import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

const URL = 'https://iidx-sp12.github.io/';

async function inspectHTML() {
  console.log(`Fetching ${URL}...`);
  
  const response = await axios.get(URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  });
  
  const html = response.data;
  
  // HTMLをファイルに保存
  fs.writeFileSync('difficulty-table.html', html);
  console.log('✅ Saved HTML to difficulty-table.html');
  
  // Cheerioでパース
  const $ = cheerio.load(html);
  
  // 構造を調査
  console.log('\n📊 HTML Structure Analysis:');
  console.log('---');
  
  // テーブルを探す
  const tables = $('table');
  console.log(`Found ${tables.length} table(s)`);
  
  tables.each((i, table) => {
    console.log(`\nTable ${i + 1}:`);
    const rows = $(table).find('tr');
    console.log(`  Rows: ${rows.length}`);
    
    // 最初の数行を表示
    rows.slice(0, 3).each((j, row) => {
      const cells = $(row).find('td, th');
      const cellTexts = cells.map((_, cell) => $(cell).text().trim()).get();
      console.log(`  Row ${j + 1}:`, cellTexts);
    });
  });
  
  // クラス名やIDを探す
  console.log('\n📝 Common classes/ids:');
  const classNames = new Set<string>();
  const ids = new Set<string>();
  
  $('[class]').each((_, el) => {
    const classes = $(el).attr('class')?.split(' ') || [];
    classes.forEach(c => classNames.add(c));
  });
  
  $('[id]').each((_, el) => {
    const id = $(el).attr('id');
    if (id) ids.add(id);
  });
  
  console.log('Classes:', Array.from(classNames).slice(0, 10));
  console.log('IDs:', Array.from(ids).slice(0, 10));
}

inspectHTML().catch(console.error);