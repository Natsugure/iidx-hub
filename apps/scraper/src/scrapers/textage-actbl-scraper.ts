import axios from 'axios';
import iconv from 'iconv-lite';

export type ChartData = {
  level: number | null;  // 1-12, または null (譜面なし)
  hasChartData: boolean;
  is12ScaleNotation: boolean;
  isInAC: boolean;
  hasCNorBSS: boolean;
};

export type SongData = {
  tag: string;
  isInAC: boolean;
  isInINFINITAS: boolean;
  hasBeginner: boolean;
  hasLeggendaria: boolean;
  
  spBeginner: ChartData;
  spNormal: ChartData;
  spHyper: ChartData;
  spAnother: ChartData;
  spLeggendaria: ChartData;
  
  dpBeginner: ChartData;
  dpNormal: ChartData;
  dpHyper: ChartData;
  dpAnother: ChartData;
  dpLeggendaria: ChartData;
  
  additionalInfo?: number;
};

// レベル値を数値に変換 (A=10, B=11, C=12...)
function parseLevel(levelStr: string | number): number | null {
  if (levelStr === 0 || levelStr === '0') return null;
  
  if (typeof levelStr === 'number') return levelStr;
  
  const str = levelStr.toString();
  const parsed = parseInt(str, 36); // 36進数として解析
  return parsed > 0 ? parsed : null;
}

// オプション情報をパース
function parseOptions(opt: number): {
  hasChartData: boolean;
  is12ScaleNotation: boolean;
  isInAC: boolean;
  hasCNorBSS: boolean;
} {
  return {
    hasChartData: (opt & 1) !== 0,
    is12ScaleNotation: (opt & 2) !== 0,
    isInAC: (opt & 4) !== 0,
    hasCNorBSS: (opt & 8) !== 0,
  };
}

function createChartData(level: string | number, opt: number): ChartData {
  const options = parseOptions(opt);
  return {
    level: parseLevel(level),
    ...options,
  };
}

function parseInclusionFlags(flag: number) {
  return {
    isInAC: (flag & 1) !== 0,
    isInINFINITAS: (flag & 2) !== 0,
    hasBeginner: (flag & 4) !== 0,
    hasLeggendaria: (flag & 8) !== 0,
  };
}

/**
 * textage.ccのactbl.jsから楽曲データを取得してパースする
 * @param filterAC trueの場合、AC版収録曲のみを返す (デフォルト: true)
 * @returns パースされた楽曲データの配列
 */
export async function fetchTextageActblData(filterAC: boolean = true): Promise<SongData[]> {
  try {
    console.log('Fetching actbl.js from textage.cc...');
    
    // Shift-JISでエンコードされているため、バイナリで取得してデコード
    const response = await axios.get('https://textage.cc/score/actbl.js', {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    // Shift-JISからUTF-8にデコード
    const decodedContent = iconv.decode(Buffer.from(response.data), 'Shift_JIS');

    console.log('Parsing JavaScript content...');
    
    // actbl オブジェクトを抽出
    const actblMatch = decodedContent.match(/actbl\s*=\s*\{([\s\S]*?)\n\};/);
    
    if (!actblMatch) {
      throw new Error('actbl object not found in the response');
    }

    const actblContent = actblMatch[1];
    
    // コメント行を削除（//で始まる行）
    const cleanedContent = actblContent
      .split('\n')
      .filter((line: string) => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('//');
      })
      .join('\n');
    
    // 各楽曲のエントリを抽出
    // 'tag':[...], の形式（配列は複数行にまたがる可能性あり）
    const entryRegex = /'([^']+)'\s*:\s*\[([\s\S]*?)\]/g;
    const songs: SongData[] = [];
    
    let match;
    let entryCount = 0;
    
    while ((match = entryRegex.exec(cleanedContent)) !== null) {
      entryCount++;
      const tag = match[1];
      const dataStr = match[2];
      
      // データ配列を解析
      // カンマで分割し、空白や改行を除去
      const dataArray = dataStr
        .split(',')
        .map(s => s.trim())
        .filter(s => s !== '')
        .map(s => {
          // ダブルクォートで囲まれた文字列はそのまま保持
          if (s.startsWith('"') && s.endsWith('"')) {
            return s.slice(1, -1); // クォートを除去
          }
          // 数値または36進数(A-F)を解析
          if (s === '0') return 0;
          const num = Number(s);
          if (!isNaN(num)) return num;
          return parseInt(s, 36);
        });

      // 配列長チェック (最低22個必要)
      if (dataArray.length < 22) {
        console.warn(`Skipping ${tag}: insufficient data (${dataArray.length} elements)`);
        continue;
      }

      const inclusionFlags = parseInclusionFlags(dataArray[0] as number);
      
      // AC版フィルタが有効で、かつAC版に収録されていない場合はスキップ
      if (filterAC && !inclusionFlags.isInAC) {
        continue;
      }

      const songData: SongData = {
        tag,
        ...inclusionFlags,
        
        // SP譜面 (インデックス 3-12)
        spBeginner: createChartData(dataArray[3], dataArray[4] as number),
        spNormal: createChartData(dataArray[5], dataArray[6] as number),
        spHyper: createChartData(dataArray[7], dataArray[8] as number),
        spAnother: createChartData(dataArray[9], dataArray[10] as number),
        spLeggendaria: createChartData(dataArray[11], dataArray[12] as number),
        
        // DP譜面 (インデックス 13-22)
        dpBeginner: createChartData(dataArray[13], dataArray[14] as number),
        dpNormal: createChartData(dataArray[15], dataArray[16] as number),
        dpHyper: createChartData(dataArray[17], dataArray[18] as number),
        dpAnother: createChartData(dataArray[19], dataArray[20] as number),
        dpLeggendaria: createChartData(dataArray[21], dataArray[22] as number),
      };

      // 追加情報があれば含める
      if (dataArray.length > 25 && typeof dataArray[25] === 'number') {
        songData.additionalInfo = dataArray[25];
      }

      songs.push(songData);
    }

    console.log(`Total entries found: ${entryCount}`);
    console.log(`Total songs parsed: ${songs.length}${filterAC ? ' (AC only)' : ''}`);
    
    if (songs.length === 0) {
      console.warn('Warning: No songs were parsed. Content sample:');
      console.warn(cleanedContent.substring(0, 500));
    }
    
    return songs;
    
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