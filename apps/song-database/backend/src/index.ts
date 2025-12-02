import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// 環境変数を読み込み
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(express.json());

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'IIDX Song Database API is running' });
});

// 楽曲一覧取得API
app.get('/api/songs', async (req, res) => {
  try {
    const songs = await prisma.song.findMany({
      include: {
        charts: true, // 譜面情報も含める
      },
      orderBy: {
        title: 'asc',
      },
    });
    
    res.json(songs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

// 特定の楽曲を取得API
app.get('/api/songs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const song = await prisma.song.findUnique({
      where: { id },
      include: {
        charts: true,
      },
    });
    
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    res.json(song);
  } catch (error) {
    console.error('Error fetching song:', error);
    res.status(500).json({ error: 'Failed to fetch song' });
  }
});

// 難易度でフィルタリング
app.get('/api/charts', async (req, res) => {
  try {
    const { playStyle, level, difficulty } = req.query;
    
    const where: any = {};
    
    if (playStyle) where.playStyle = playStyle as string;
    if (level) where.level = parseInt(level as string);
    if (difficulty) where.difficulty = difficulty as string;
    
    const charts = await prisma.chart.findMany({
      where,
      include: {
        song: true, // 楽曲情報も含める
      },
      orderBy: [
        { level: 'asc' },
        { song: { title: 'asc' } },
      ],
    });
    
    res.json(charts);
  } catch (error) {
    console.error('Error fetching charts:', error);
    res.status(500).json({ error: 'Failed to fetch charts' });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});