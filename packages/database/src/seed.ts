import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // サンプル楽曲データ
  const songs = [
    {
      title: 'MENDES',
      titleKana: 'めんです',
      genre: 'SAMBA',
      artist: 'Hugo Lobo',
      bpm: '140',
      version: '7th style',
      charts: [
        { playStyle: 'SP', difficulty: 'NORMAL', level: 5, notes: 456 },
        { playStyle: 'SP', difficulty: 'HYPER', level: 8, notes: 789 },
        { playStyle: 'SP', difficulty: 'ANOTHER', level: 11, notes: 1234, unofficialLevel: '11.5' },
      ],
    },
    {
      title: 'FLOWER',
      titleKana: 'ふらわー',
      genre: 'HAPPY HARDCORE',
      artist: 'DJ YOSHITAKA',
      bpm: '173',
      version: 'Resort Anthem',
      charts: [
        { playStyle: 'SP', difficulty: 'NORMAL', level: 6, notes: 612 },
        { playStyle: 'SP', difficulty: 'HYPER', level: 10, notes: 1133 },
        { playStyle: 'SP', difficulty: 'ANOTHER', level: 12, notes: 2020, unofficialLevel: '12.3' },
      ],
    },
    {
      title: '卑弥呼',
      titleKana: 'ひみこ',
      genre: 'WORLD/ELECTRONICA',
      artist: '朱雀 VS 玄武',
      bpm: '90-180',
      version: '14 GOLD',
      charts: [
        { playStyle: 'SP', difficulty: 'NORMAL', level: 7, notes: 688 },
        { playStyle: 'SP', difficulty: 'HYPER', level: 11, notes: 1248 },
        { playStyle: 'SP', difficulty: 'ANOTHER', level: 12, notes: 1899, unofficialLevel: '12.5' },
      ],
    },
  ];

  // データベースに投入
  for (const songData of songs) {
    const { charts, ...songInfo } = songData;
    
    const song = await prisma.song.create({
      data: {
        ...songInfo,
        charts: {
          create: charts,
        },
      },
      include: {
        charts: true,
      },
    });
    
    console.log(`✅ Created song: ${song.title} with ${song.charts.length} charts`);
  }

  console.log('✨ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });