import axios from 'axios';
import iconv from 'iconv-lite';

export type DatatblEntry = {
  tag: string;
  spBeginnerNotes: number;
  spNormalNotes: number;
  spHyperNotes: number;
  spAnotherNotes: number;
  spLeggendariaNotes: number;
  dpNormalNotes: number;
  dpHyperNotes: number;
  dpAnotherNotes: number;
  dpLeggendariaNotes: number;
  bpm: string;
  bpmOverrides?: Map<number, string>; // type番号 -> BPM文字列
};

/**
 * BPM特殊ケースの定義 (get_bpm関数の内容)
 */
const BPM_SPECIAL_CASES: { [tag: string]: { [type: number]: string } } = {
  'gracyber': { 4: '160～167', 9: '160～167' },
  'gracybr1': { 4: '160～167', 9: '160～167' },
  'empathy': { 3: '85～170', 4: '85～170' },
  'karma': { 4: '222', 9: '222' },
  'littlepr': { 0: '212', 1: '212', 2: '212', 7: '212' },
  'quell': { 4: '162', 9: '162' },
  '_valse17': { 
    0: '190～290', 1: '190～290', 2: '190～290', 
    4: '230～320', 
    7: '190～290', 
    9: '220～350' 
  },
  'titans': { 5: '97～194', 10: '97～194' },
  'neu': { 0: '95', 1: '95', 2: '95', 7: '95' },
  'ebnyivry': { 5: '113～170', 10: '113～170' },
  'crew': { 3: '152', 4: '155', 8: '170', 9: '176' },
  'futuredd': { 4: '110～220', 9: '110～220' },
  'ovdoser': { 6: '134', 7: '134', 8: '134', 9: '134', 10: '134' },
  'tablets': { 4: '180～360' },
  'parasurv': { 6: '290', 7: '290', 8: '290', 9: '290', 10: '290' },
  'inf_ffs': { 4: '110～120' },
  'eraser': { 4: '135～270', 9: '135～270' },
  'outlmtdd': { 4: '175', 9: '175' },
  '_pkaijin': { 0: '116～180', 1: '116～180', 2: '116～180', 7: '116～180' },
  '_aether': { 5: '24～192', 10: '24～192' },
  'sei_teri': { 5: '137～273', 10: '137～273' },
};

/**
 * typeインデックスから難易度情報を取得
 * 0: SP BEGINNER, 1: SP NORMAL, 2: SP HYPER, 3: SP ANOTHER, 4: SP LEGGENDARIA
 * 5: (未使用), 6: (未使用)
 * 7: DP BEGINNER, 8: DP NORMAL, 9: DP HYPER, 10: DP ANOTHER, 11: DP LEGGENDARIA
 */
function getTypeDescription(type: number): string {
  const descriptions = [
    'SP BEGINNER', 'SP NORMAL', 'SP HYPER', 'SP ANOTHER', 'SP LEGGENDARIA',
    '(unused)', '(unused)',
    'DP BEGINNER', 'DP NORMAL', 'DP HYPER', 'DP ANOTHER', 'DP LEGGENDARIA'
  ];
  return descriptions[type] || 'unknown';
}

/**
 * 特定の譜面タイプに対するBPMを取得 (get_bpm関数の実装)
 */
function getBpmForType(tag: string, type: number, defaultBpm: string): string {
  const specialCase = BPM_SPECIAL_CASES[tag];
  if (specialCase) {
    // 完全一致を優先
    if (specialCase[type] !== undefined) {
      return specialCase[type];
    }
    // 範囲指定のケース (例: type>=6)
    if (tag === 'ovdoser' && type >= 6) return '134';
    if (tag === 'parasurv' && type >= 6) return '290';
  }
  return defaultBpm;
}

/**
 * textage.ccのdatatbl.jsから楽曲データを取得してパースする
 * @returns パースされた楽曲データのMap (tag -> DatatblEntry)
 */
export async function fetchTextageDataTblData(): Promise<Map<string, DatatblEntry>> {
  try {
    console.log('Fetching datatbl.js from textage.cc...');
    
    // Shift-JISでエンコードされているため、バイナリで取得してデコード
    const response = await axios.get('https://textage.cc/score/datatbl.js', {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    // Shift-JISからUTF-8にデコード
    const decodedContent = iconv.decode(Buffer.from(response.data), 'Shift_JIS');

    console.log('Parsing JavaScript content...');
    
    // datatbl オブジェクトを抽出
    const datatblMatch = decodedContent.match(/datatbl\s*=\s*\{([\s\S]*?)\n\};/);
    
    if (!datatblMatch) {
      throw new Error('datatbl object not found in the response');
    }

    const datatblContent = datatblMatch[1];
    
    // コメント行を削除（//で始まる行）
    const cleanedContent = datatblContent
      .split('\n')
      .filter((line: string) => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('//');
      })
      .join('\n');
    
    // 各楽曲のエントリを抽出
    // 'tag':[...], の形式
    const entryRegex = /'([^']+)'\s*:\s*\[([\s\S]*?)\]/g;
    const entries = new Map<string, DatatblEntry>();
    
    let match;
    let entryCount = 0;
    
    while ((match = entryRegex.exec(cleanedContent)) !== null) {
      entryCount++;
      const tag = match[1];
      const dataStr = match[2];
      
      // データ配列を解析
      const dataArray = dataStr
        .split(',')
        .map(s => s.trim())
        .filter(s => s !== '')
        .map(s => {
          // ダブルクォートで囲まれた文字列 (BPM)
          if (s.startsWith('"') && s.endsWith('"')) {
            return s.slice(1, -1);
          }
          // 数値
          const num = Number(s);
          return isNaN(num) ? 0 : num;
        });

      // 配列長チェック (12個必要: ノーツ10個 + unused + BPM)
      if (dataArray.length < 12) {
        console.warn(`Skipping ${tag}: insufficient data (${dataArray.length} elements)`);
        continue;
      }

      const defaultBpm = dataArray[11] as string;
      
      // 各譜面タイプの特殊BPMを事前計算
      const bpmOverrides = new Map<number, string>();
      for (let type = 0; type <= 11; type++) {
        const bpmForType = getBpmForType(tag, type, defaultBpm);
        if (bpmForType !== defaultBpm) {
          bpmOverrides.set(type, bpmForType);
        }
      }

      const entry: DatatblEntry = {
        tag,
        // インデックス 0-5: SP譜面
        spBeginnerNotes: dataArray[1] as number,
        spNormalNotes: dataArray[2] as number,
        spHyperNotes: dataArray[3] as number,
        spAnotherNotes: dataArray[4] as number,
        spLeggendariaNotes: dataArray[5] as number,
        // インデックス 6は旧CSのDPBeginnerなのでスキップ
        dpNormalNotes: dataArray[7] as number,
        dpHyperNotes: dataArray[8] as number,
        dpAnotherNotes: dataArray[9] as number,
        dpLeggendariaNotes: dataArray[10] as number,
        // BPM
        bpm: defaultBpm,
        bpmOverrides: bpmOverrides.size > 0 ? bpmOverrides : undefined,
      };

      entries.set(tag, entry);
    }

    console.log(`Total datatbl entries found: ${entryCount}`);
    console.log(`Total datatbl entries parsed: ${entries.size}`);
    
    if (entries.size === 0) {
      console.warn('Warning: No datatbl entries were parsed. Content sample:');
      console.warn(cleanedContent.substring(0, 500));
    }
    
    return entries;
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
      }
    } else {
      console.error('Error:', error);
    }
    throw error;
  }
}

/**
 * 特定の譜面タイプに対応するノーツ数を取得
 */
export function getNotesForChart(
  entry: DatatblEntry,
  playStyle: 'SP' | 'DP',
  difficulty: 'BEGINNER' | 'NORMAL' | 'HYPER' | 'ANOTHER' | 'LEGGENDARIA'
): number {
  if (playStyle === 'SP') {
    switch (difficulty) {
      case 'BEGINNER': return entry.spBeginnerNotes;
      case 'NORMAL': return entry.spNormalNotes;
      case 'HYPER': return entry.spHyperNotes;
      case 'ANOTHER': return entry.spAnotherNotes;
      case 'LEGGENDARIA': return entry.spLeggendariaNotes;
    }
  } else {
    switch (difficulty) {
      case 'BEGINNER': throw new Error('DP BEGINNER does not exist in current AC version');
      case 'NORMAL': return entry.dpNormalNotes;
      case 'HYPER': return entry.dpHyperNotes;
      case 'ANOTHER': return entry.dpAnotherNotes;
      case 'LEGGENDARIA': return entry.dpLeggendariaNotes;
    }
  }
}

/**
 * 特定の譜面タイプに対応するBPMを取得
 */
export function getBpmForChart(
  entry: DatatblEntry,
  playStyle: 'SP' | 'DP',
  difficulty: 'BEGINNER' | 'NORMAL' | 'HYPER' | 'ANOTHER' | 'LEGGENDARIA'
): string {
  // type番号を計算
  let type: number;
  if (playStyle === 'SP') {
    switch (difficulty) {
      case 'BEGINNER': type = 0; break;
      case 'NORMAL': type = 1; break;
      case 'HYPER': type = 2; break;
      case 'ANOTHER': type = 3; break;
      case 'LEGGENDARIA': type = 4; break;
      default: type = 0;
    }
  } else {
    switch (difficulty) {
      case 'BEGINNER': throw new Error('DP BEGINNER does not exist in current AC version');
      case 'NORMAL': type = 8; break;
      case 'HYPER': type = 9; break;
      case 'ANOTHER': type = 10; break;
      case 'LEGGENDARIA': type = 11; break;
      default: type = 7;
    }
  }

  // 特殊BPMがあればそれを返す
  if (entry.bpmOverrides?.has(type)) {
    return entry.bpmOverrides.get(type)!;
  }

  // デフォルトBPMを返す
  return entry.bpm;
}