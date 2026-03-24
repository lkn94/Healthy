import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const modules = [
  {
    key: 'smart-lighting',
    title: 'Smarte Beleuchtung',
    description: 'Automatisiere deine Lampen mit 5 Szenen.',
    requiredEnergy: 5000,
    requiredAutomation: 0,
    requiredAI: 0,
    icon: '💡',
    story: 'Deine Lampen reagieren jetzt dynamisch auf Tageszeit und Stimmung.',
    orderIndex: 1
  },
  {
    key: 'climate-core',
    title: 'Klima-Zentrale',
    description: 'Reguliere Temperatur und Luftqualität automatisch.',
    requiredEnergy: 15000,
    requiredAutomation: 0,
    requiredAI: 0,
    icon: '🌡️',
    story: 'Die Klima-Zentrale lernt, wann du frische Luft brauchst.',
    orderIndex: 2
  },
  {
    key: 'security-hub',
    title: 'Security Hub',
    description: 'Bewegungssensoren und Türkontakte reagieren auf dein Tempo.',
    requiredEnergy: 30000,
    requiredAutomation: 100,
    requiredAI: 0,
    icon: '🛡️',
    story: 'Dein Zuhause wacht nun mit smarten Sensoren über dich.',
    orderIndex: 3
  },
  {
    key: 'automation-brain',
    title: 'Automation Brain',
    description: 'Dein Zuhause lernt Routinen und reagiert proaktiv.',
    requiredEnergy: 60000,
    requiredAutomation: 300,
    requiredAI: 0,
    icon: '🧠',
    story: 'Das Automation Brain orchestriert jede Routine millisekundengenau.',
    orderIndex: 4
  },
  {
    key: 'ai-companion',
    title: 'KI-Companion',
    description: 'Eine persönliche Assistenz, die dich kennt.',
    requiredEnergy: 120000,
    requiredAutomation: 600,
    requiredAI: 50,
    icon: '🤖',
    story: 'Dein KI-Companion begrüßt dich mit personalisierten Insights.',
    orderIndex: 5
  }
];

async function main() {
  for (const module of modules) {
    await prisma.collectionModule.upsert({
      where: { key: module.key },
      update: module,
      create: module
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
