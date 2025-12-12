/**
 * textage.cc の titletbl.js をパースして楽曲情報を抽出するスクリプト
 * 
 * データ形式:
 * titletbl={
 *   'song_id': [version, id, option, genre, artist, title, subtitle?]
 * }
 */

import axios from 'axios';
import * as fs from 'fs';

// インデックス定数（titletbl.jsから）
const VERINDEX = 0;     // バージョン番号
const IDINDEX = 1;       // 楽曲ID
const OPTINDEX = 2;      // オプション
const GENREINDEX = 3;    // ジャンル
const ARTISTINDEX = 4;   // アーティスト名
const TITLEINDEX = 5;    // 楽曲タイトル
const SUBTITLEINDEX = 6; // サブタイトル

interface TextageSong {
  songId: string;           // JavaScriptオブジェクトのキー
  version: number;          // 収録バージョン
  textageId: number;        // textage内部ID
  option: number;           // オプションフラグ
  genre: string;            // ジャンル
  artist: string;           // アーティスト
  title: string;            // タイトル
  subtitle?: string;        // サブタイトル
  rawTitle: string;         // HTML装飾込みの生タイトル
}


function parseTitleTbl(jsContent: string): TextageSong[] {
  const songs: TextageSong[] = [];

  // titletbl={...} の部分を抽出（複数行対応）
  const match = jsContent.match(/titletbl\s*=\s*\{([\s\S]*?)\n\}/);
  if (!match) {
    throw new Error('titletbl object not found in JavaScript content');
  }

  const titletblContent = match[1];

  // 各楽曲エントリを正規表現でパース（改行とタブに対応）
  const entryRegex = /'([^']+)'\s*:\s*\[([^\]]+)\]/g;
  
  let entryMatch;
  let matchCount = 0;
  
  while ((entryMatch = entryRegex.exec(titletblContent)) !== null) {
    matchCount++;
    const songId = entryMatch[1];
    const dataStr = entryMatch[2];

    if (songId === '__dmy__' || songId.startsWith('//')) {
      continue;
    }

    if (dataStr.trim().startsWith('//')) {
      continue;
    }

    try {
      const values = parseDataArray(dataStr);

      // 値が不足している場合はスキップ
      if (values.length < 6) {
        console.warn(`Skipping ${songId}: insufficient data (${values.length} values)`);
        continue;
      }

      const rawTitle = values[TITLEINDEX] || '';
      const cleanTitle = cleanHtmlString(rawTitle);

      const song: TextageSong = {
        songId,
        version: parseInt(values[VERINDEX]) || 0,
        textageId: parseInt(values[IDINDEX]) || 0,
        option: parseInt(values[OPTINDEX]) || 0,
        genre: cleanString(values[GENREINDEX]),
        artist: cleanString(values[ARTISTINDEX]),
        title: cleanTitle,
        rawTitle: rawTitle,
      };

      if (values[SUBTITLEINDEX]) {
        song.subtitle = cleanString(values[SUBTITLEINDEX]);
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
  let depth = 0; // 括弧のネスト深度

  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr[i];
    const prevChar = i > 0 ? dataStr[i - 1] : '';

    // 括弧の深度を追跡
    if (char === '(' && !inString) depth++;
    if (char === ')' && !inString) depth--;

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
    if (char === ',' && !inString && depth === 0) {
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
  return str
    .trim()
    .replace(/^["']|["']$/g, '') // 前後の引用符を除去
    .replace(/\\"/g, '"')        // エスケープされた引用符を戻す
    .replace(/\\'/g, "'");
}

/**
 * HTML装飾を除去（.fontcolor()など）
 */
function cleanHtmlString(str: string): string {
  if (!str) return '';
  
  let cleaned = str.replace(/\.fontcolor\([^)]+\)/g, '');
  
  cleaned = cleaned.replace(/\.link\([^)]+\)/g, '');
  
  return cleanString(cleaned);
}


async function fetchAndParseTitletbl(): Promise<TextageSong[]> {
  const url = 'https://textage.cc/score/titletbl.js';
  
  console.log(`Fetching ${url}...`);
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Charset': 'utf-8',
      },
      responseType: 'text',
      responseEncoding: 'utf8',
      timeout: 15000,
    });

    console.log(`✓ Fetched successfully (${response.data.length} bytes)`);
    
    // デバッグ: ファイルの最初の部分を表示
    console.log(`First 200 chars: ${response.data.substring(0, 200)}`);
    
    const songs = parseTitleTbl(response.data);
    console.log(`✓ Parsed ${songs.length} songs`);
    
    return songs;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch titletbl.js: ${error.message}`);
    }
    throw error;
  }
}


// エクスポート
export {
  TextageSong,
  parseTitleTbl,
  fetchAndParseTitletbl,
};