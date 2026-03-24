<template>
  <section class="space-y-8">
    <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard>
        <template #label>Steps Today</template>
        {{ overview?.today.steps ?? 0 }}
        <template #description>
          Ziel {{ overview?.today.goal }} | Ø7 {{ overview?.today.average7 }}
        </template>
      </KpiCard>
      <KpiCard>
        <template #label>Ø 30 Tage</template>
        {{ overview?.today.average30 ?? 0 }}
        <template #description>Langfristiger Trend</template>
      </KpiCard>
      <KpiCard>
        <template #label>Gesamt Schritte</template>
        {{ overview?.lifetime.totalSteps ?? 0 }}
        <template #description>{{ overview?.lifetime.daysTracked ?? 0 }} Tage Tracking</template>
      </KpiCard>
      <KpiCard>
        <template #label>Streak</template>
        {{ overview?.lifetime.currentStreak ?? 0 }}
        <template #description>Longest {{ overview?.lifetime.longestStreak ?? 0 }} Tage</template>
      </KpiCard>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div class="flex items-center justify-between text-sm text-white/60">
          <span>Weekly Trajectory</span>
          <div class="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-white/40">
            {{ weeklyTotal }} steps
          </div>
        </div>
        <EChart :options="weeklyChart" height="320px" class="mt-4" />
      </div>
      <div class="rounded-3xl border border-white/10 bg-gradient-to-br from-aurora/20 to-pulse/10 p-6 space-y-4">
        <div class="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-white/60">
          <span>Momentum</span>
          <span>{{ momentumLabel }}</span>
        </div>
        <div class="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
          <div class="flex items-center justify-between text-white/80">
            <span>Heute</span>
            <span>{{ overview?.today.steps.toLocaleString('de-DE') ?? 0 }} Schritte</span>
          </div>
          <div class="flex items-center justify-between text-white/60 mt-2">
            <span>Ø letzte 7 Tage</span>
            <span>{{ overview?.today.average7.toLocaleString('de-DE') ?? 0 }}</span>
          </div>
          <div class="flex items-center justify-between text-white/60 mt-2">
            <span>Ø letzte 30 Tage</span>
            <span>{{ overview?.today.average30.toLocaleString('de-DE') ?? 0 }}</span>
          </div>
        </div>
        <p class="text-sm text-white/70">
          Momentum zeigt, wie deine heutigen Schritte im Vergleich zum persönlichen 7- bzw. 30-Tage-Schnitt stehen. Grün bedeutet über dem Trend, Rosa darunter.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useDashboardStore } from '../stores/dashboard';
import KpiCard from '../components/cards/KpiCard.vue';
import EChart from '../components/charts/EChart.vue';

const dashboard = useDashboardStore();

onMounted(() => {
  dashboard.loadOverview();
});

const overview = computed(() => dashboard.overview);

const weeklyChart = computed(() => ({
  grid: { left: 10, right: 10, top: 30, bottom: 0, containLabel: true },
  xAxis: {
    type: 'category',
    data: overview.value?.weekly.map((item) => item.date) ?? [],
    axisLabel: { color: '#999' },
    axisLine: { lineStyle: { color: '#1f2437' } }
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#999' },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
  },
  tooltip: { trigger: 'axis' },
  series: [
    {
      data: overview.value?.weekly.map((item) => item.steps) ?? [],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#37F2C0', width: 3 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(55,242,192,0.4)' },
            { offset: 1, color: 'rgba(55,242,192,0)' }
          ]
        }
      },
      symbol: 'circle',
      symbolSize: 8
    }
  ]
}));

const weeklyTotal = computed(() => overview.value?.weekly.reduce((sum, day) => sum + day.steps, 0) ?? 0);

const momentumLabel = computed(() => {
  if (!overview.value) return '0%';
  const { steps, average7 } = overview.value.today;
  if (average7 === 0) return '100%';
  const ratio = Math.round((steps / average7) * 100);
  return `${ratio}% vs 7d`;
});
</script>
