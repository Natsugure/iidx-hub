import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 型定義
export interface Chart {
  id: string;
  songId: string;
  playStyle: string;
  difficulty: string;
  level: number;
  unofficialLevel: string | null;
  notes: number | null;
  difficultyTableUrl: string | null;
  wikiUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Song {
  id: string;
  title: string;
  titleKana: string | null;
  genre: string;
  artist: string;
  bpm: string;
  version: string;
  charts: Chart[];
  createdAt: string;
  updatedAt: string;
}

// API関数
export const api = {
  // 楽曲一覧を取得
  getSongs: async (): Promise<Song[]> => {
    const response = await apiClient.get('/api/songs');
    return response.data;
  },

  // 特定の楽曲を取得
  getSong: async (id: string): Promise<Song> => {
    const response = await apiClient.get(`/api/songs/${id}`);
    return response.data;
  },

  // 譜面をフィルタリングして取得
  getCharts: async (params?: {
    playStyle?: string;
    level?: number;
    difficulty?: string;
  }): Promise<Chart[]> => {
    const response = await apiClient.get('/api/charts', { params });
    return response.data;
  },

  // ヘルスチェック
  healthCheck: async (): Promise<{ status: string; message: string }> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};