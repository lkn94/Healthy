<template>
  <section class="space-y-8">
    <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard>
        <template #label>Total Steps</template>
        {{ stats.totalSteps.toLocaleString('de-DE') }}
        <template #description>{{ stats.daysTracked }} Tage dokumentiert</template>
      </KpiCard>
      <KpiCard>
        <template #label>Total KM</template>
        {{ stats.totalKm.toFixed(1) }} km
        <template #description>Distanz seit Start</template>
      </KpiCard>
      <KpiCard>
        <template #label>Best Day</template>
        {{ stats.bestDaySteps }}
      </KpiCard>
      <KpiCard>
        <template #label>Longest Streak</template>
        {{ stats.longestStreak }} Tage
      </KpiCard>
    </div>

    <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 class="text-xl font-display">Roadmap</h3>
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
  { title: 'Next Badge', icon: 'A', value: stats.value.totalSteps >= 100000 ? 'Legend' : '100k Steps' },
  { title: 'Series', icon: 'S', value: `${stats.value.longestStreak} Tage` },
  { title: 'Focus', icon: 'F', value: `${stats.value.bestWeekSteps} Schritte/Woche` }
]);
</script>
