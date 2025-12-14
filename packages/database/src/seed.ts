// packages/database/src/seed.ts
import prisma from './client';

// バージョンマスタデータ
const VERSIONS = [
  { id: '1', name: '1st style' },
  { id: 'ss', name: 'substream' },
  { id: '2', name: '2nd style' },
  { id: '3', name: '3rd style' },
  { id: '4', name: '4th style' },
  { id: '5', name: '5th style' },
  { id: '6', name: '6th style' },
  { id: '7', name: '7th style' },
  { id: '8', name: '8th style' },
  { id: '9', name: '9th style' },
  { id: '10', name: '10th style' },
  { id: '11', name: 'IIDX RED' },
  { id: '12', name: 'HAPPY SKY' },
  { id: '13', name: 'DistorteD' },
  { id: '14', name: 'GOLD' },
  { id: '15', name: 'DJ TROOPERS' },
  { id: '16', name: 'EMPRESS' },
  { id: '17', name: 'SIRIUS' },
  { id: '18', name: 'Resort Anthem' },
  { id: '19', name: 'Lincle' },
  { id: '20', name: 'tricoro' },
  { id: '21', name: 'SPADA' },
  { id: '22', name: 'PENDUAL' },
  { id: '23', name: 'copula' },
  { id: '24', name: 'SINOBUZ' },
  { id: '25', name: 'CANNON BALLERS' },
  { id: '26', name: 'Rootage' },
  { id: '27', name: 'HEROIC VERSE' },
  { id: '28', name: 'BISTROVER' },
  { id: '29', name: 'CastHour' },
  { id: '30', name: 'RESIDENT' },
  { id: '31', name: 'EPOLIS' },
  { id: '32', name: 'Pinky Crush' },
  { id: '33', name: 'Sparkle Shower'}
];

async function main() {
  console.log('🌱 Starting seed...');

  // バージョンマスタを投入
  console.log('Seeding versions...');
  for (const version of VERSIONS) {
    await prisma.version.upsert({
      where: { id: version.id },
      update: { name: version.name },
      create: version,
    });
  }
  console.log(`✓ Seeded ${VERSIONS.length} versions`);

  console.log('✅ Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });