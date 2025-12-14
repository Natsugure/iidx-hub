/**
 * textage.cc の titletbl.js をパースして楽曲情報を抽出するスクリプト
 * 
 * データ形式:
 * titletbl={
 *   'song_id': [version, id, option, genre, artist, title, subtitle?]
 * }
 */

import axios from 'axios';
import iconv from 'iconv-lite';
import he from 'he';

// インデックス定数（titletbl.jsから）
const VERINDEX = 0;     // バージョン番号
const IDINDEX = 1;       // 楽曲ID
const OPTINDEX = 2;      // オプション
const GENREINDEX = 3;    // ジャンル
const ARTISTINDEX = 4;   // アーティスト名
const TITLEINDEX = 5;    // 楽曲タイトル
const SUBTITLEINDEX = 6; // サブタイトル

type TextageSong = {
  songId: string;           // JavaScriptオブジェクトのキー
  version: string;          // 収録バージョン
  textageId: number;        // textage内部ID
  option: number;           // オプションフラグ
  genre: string;            // ジャンル
  artist: string;           // アーティスト
  title: string;            // タイトル
  subtitle?: string;        // サブタイトル
  rawTitle: string;         // HTML装飾込みの生タイトル
};

function parseTitleTbl(jsContent: string): TextageSong[] {
  const songs: TextageSong[] = [];

  // titletbl={...} の部分を抽出（複数行対応）
  const match = jsContent.match(/titletbl\s*=\s*\{([\s\S]*?)\n\}/);
  if (!match) {
    throw new Error('titletbl object not found in JavaScript content');
  }

  const titletblContent = match[1];

  // 各楽曲エントリを正規表現でパース
  // 文字列内の]や、ネストした構造に対応
  const entryRegex = /'([^']+)'\s*:\s*\[((?:[^"'\[\]]|"[^"]*"|'[^']*'|\[[^\]]*\])*)\]/g;
  
  let entryMatch;
  let matchCount = 0;
  
  while ((entryMatch = entryRegex.exec(titletblContent)) !== null) {
    matchCount++;
    const songId = entryMatch[1];
    const dataStr = entryMatch[2];

    // MAX 360のデバッグ
    if (songId.includes('max') && songId.includes('360')) {
      console.log(`Found MAX 360: songId="${songId}"`);
      console.log(`Raw dataStr: ${dataStr}`);
    }

    if (songId === '__dmy__' || songId.startsWith('//')) {
      continue;
    }

    if (dataStr.trim().startsWith('//')) {
      continue;
    }

    try {
      const values = parseDataArray(dataStr);

      // MAX 360のデバッグ
      if (songId.includes('max') && songId.includes('360')) {
        console.log(`Parsed values (${values.length}):`, values);
      }

      // 値が不足している場合はスキップ
      if (values.length < 6) {
        console.warn(`Skipping ${songId}: insufficient data (${values.length} values)`);
        continue;
      }

      const rawTitle = values[TITLEINDEX] || '';
      const cleanTitle = cleanHtmlString(rawTitle);

      const song: TextageSong = {
        songId,
        version: cleanString(values[VERINDEX]).toLowerCase(),
        textageId: parseInt(values[IDINDEX]) || 0,
        option: parseInt(values[OPTINDEX]) || 0,
        genre: cleanString(values[GENREINDEX]),
        artist: cleanString(values[ARTISTINDEX]),
        title: cleanTitle,
        rawTitle: rawTitle,
      };

      if (values[SUBTITLEINDEX]) {
        song.subtitle = cleanHtmlString(values[SUBTITLEINDEX]);
      }

      songs.push(song);
    } catch (err) {
      console.warn(`Failed to parse entry for ${songId}:`, err);
    }
  }

  console.log(`Regex matched ${matchCount} entries, parsed ${songs.length} valid songs`);

  return songs;
}

function parseDataArray(dataStr: string): string[] {
  const values: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let parenDepth = 0;    // 丸括弧のネスト深度
  let bracketDepth = 0;  // 角括弧のネスト深度

  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr[i];
    const prevChar = i > 0 ? dataStr[i - 1] : '';

    // 括弧の深度を追跡（文字列外のみ）
    if (!inString) {
      if (char === '(') parenDepth++;
      if (char === ')') parenDepth--;
      if (char === '[') bracketDepth++;
      if (char === ']') bracketDepth--;
    }

    // 文字列の開始/終了を検出
    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      // 引用符は含める（後でクリーンアップ）
      current += char;
      continue;
    }

    // カンマで分割（文字列内や括弧内でない場合のみ）
    if (char === ',' && !inString && parenDepth === 0 && bracketDepth === 0) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // 最後の要素を追加
  if (current.trim()) {
    values.push(current.trim());
  }

  return values;
}

/**
 * 文字列のクリーンアップ（前後の空白、引用符を除去）
 */
function cleanString(str: string): string {
  if (!str) return '';
  
  let cleaned = str
    .trim()
    .replace(/^["']|["']$/g, ''); // 前後の引用符を除去
  
  // JavaScriptのエスケープシーケンスをデコード
  cleaned = decodeEscapeSequences(cleaned);
  
  // HTML文字参照をデコード（数値・名前付き両方に対応）
  cleaned = he.decode(cleaned);
  
  // HTMLタグを除去
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  
  // エスケープされたスラッシュを通常のスラッシュに
  cleaned = cleaned.replace(/\\\//g, '/');
  
  return cleaned;
}

/**
 * JavaScriptのエスケープシーケンスをデコード
 */
function decodeEscapeSequences(str: string): string {
  // \uXXXX形式のUnicodeエスケープをデコード
  let decoded = str.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // 他の基本的なエスケープシーケンス
  decoded = decoded
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
  
  return decoded;
}

/**
 * HTML装飾を除去（.fontcolor()など）
 */
function cleanHtmlString(str: string): string {
  if (!str) return '';
  
  // .fontcolor()を除去
  let cleaned = str.replace(/\.fontcolor\([^)]+\)/g, '');
  
  // .link()を除去
  cleaned = cleaned.replace(/\.link\([^)]+\)/g, '');
  
  return cleanString(cleaned);
}

async function fetchAndParseTitletbl(): Promise<TextageSong[]> {
  const url = 'https://textage.cc/score/titletbl.js';
  
  console.log(`Fetching ${url}...`);
  
  try {
    // Shift-JISでエンコードされているため、バイナリで取得してデコード
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      responseType: 'arraybuffer', // バイナリで取得
      timeout: 15000,
    });

    // Shift-JISからUTF-8にデコード
    const decodedContent = iconv.decode(Buffer.from(response.data), 'Shift_JIS');
    
    console.log(`✓ Fetched successfully (${decodedContent.length} characters)`);
    
    // デバッグ: ファイルの最初の部分を表示
    console.log(`First 200 chars: ${decodedContent.substring(0, 200)}`);
    
    const songs = parseTitleTbl(decodedContent);
    console.log(`✓ Parsed ${songs.length} songs`);
    
    return songs;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch titletbl.js: ${error.message}`);
    }
    throw error;
  }
}

export {
  TextageSong,
  parseTitleTbl,
  fetchAndParseTitletbl,
};