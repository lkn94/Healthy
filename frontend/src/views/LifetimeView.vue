<template>
  <section class="space-y-8">
    <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard>
        <template #label>Gesamt Schritte</template>
        {{ stats.totalSteps.toLocaleString('de-DE') }}
        <template #description>{{ stats.daysTracked }} Tage dokumentiert</template>
      </KpiCard>
      <KpiCard>
        <template #label>Gesamt Kilometer</template>
        {{ stats.totalKm.toFixed(1) }} km
        <template #description>Distanz seit Start</template>
      </KpiCard>
      <KpiCard>
        <template #label>Bester Tag</template>
        {{ stats.bestDaySteps }}
      </KpiCard>
      <KpiCard>
        <template #label>Längste Serie</template>
        {{ stats.longestStreak }} Tage
      </KpiCard>
    </div>

    <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 class="text-xl font-display">Meilensteine</h3>
      <div class="mt-6 space-y-4">
        <div v-for="milestone in milestones" :key="milestone.title" class="flex items-center gap-4">
          <div class="h-10 w-10 rounded-2xl bg-aurora/20 text-aurora flex items-center justify-center font-display">
            {{ milestone.icon }}
          </div>
          <div>
            <p class="text-sm uppercase tracking-[0.4em] text-white/50">{{ milestone.title }}</p>
            <p class="text-lg text-white">{{ milestone.value }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-3xl border border-white/10 bg-gradient-to-br from-aurora/10 to-pulse/5 p-6">
      <h3 class="text-xl font-display">Wissenswerte Fakten</h3>
      <p class="text-white/60">Zahlen machen mehr Spaß, wenn man sie sich vorstellen kann.</p>
      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <div v-for="fact in funFacts" :key="fact.title" class="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p class="text-xs uppercase tracking-[0.4em] text-white/50">{{ fact.title }}</p>
          <p class="text-2xl font-display mt-2">{{ fact.value }}</p>
          <p class="text-sm text-white/60 mt-1">{{ fact.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import KpiCard from '../components/cards/KpiCard.vue';
import { useConnectionsStore } from '../stores/connections';

const store = useConnectionsStore();

onMounted(() => {
  store.fetchLifetimeStats();
});

const stats = computed(() => store.lifetimeStats);

const milestones = computed(() => [
  { title: 'Nächstes Abzeichen', icon: 'A', value: stats.value.totalSteps >= 100000 ? 'Legende' : '100k Schritte' },
  { title: 'Serienfokus', icon: 'S', value: `${stats.value.longestStreak} Tage` },
  { title: 'Wochenrekord', icon: 'F', value: `${stats.value.bestWeekSteps} Schritte/Woche` }
]);

const funFacts = computed(() => {
  const earthCircumferenceKm = 40075;
  const moonDistanceKm = 384_400;
  const marathonKm = 42.195;
  const avgDailyGoal = 10_000;

  const lapsAroundEarth = stats.value.totalKm / earthCircumferenceKm;
  const tripsToMoon = stats.value.totalKm / moonDistanceKm;
  const marathons = stats.value.totalKm / marathonKm;
  const goalDays = stats.value.totalSteps / avgDailyGoal;

  return [
    {
      title: 'Erdumrundungen',
      value: `${lapsAroundEarth >= 1 ? lapsAroundEarth.toFixed(2) : (lapsAroundEarth * 1000).toFixed(0)}${lapsAroundEarth >= 1 ? '' : '‰'}`,
      description:
        lapsAroundEarth >= 1
          ? 'So oft bist du rechnerisch um die Erde gelaufen.'
          : 'Du bist auf dem Weg zur ersten Erdumrundung.'
    },
    {
      title: 'Reisen zum Mond',
      value: `${tripsToMoon.toFixed(3)}`,
      description: 'Distanz bis zum Mond (einfach), basierend auf deinen Kilometern.'
    },
    {
      title: 'Marathons',
      value: `${Math.floor(marathons)}`,
      description: 'Virtuelle Marathonläufe dank deiner Schritte.'
    },
    {
      title: 'Zieltage',
      value: `${Math.floor(goalDays)}`,
      description: 'So viele 10k-Schritt-Tage stecken in deiner Lebensleistung.'
    }
  ];
});
</script>
