<template>
  <section class="space-y-8">
    <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard>
        <template #label>Schritte heute</template>
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
        <template #label>Serie</template>
        {{ overview?.lifetime.currentStreak ?? 0 }}
        <template #description>Längste Serie {{ overview?.lifetime.longestStreak ?? 0 }} Tage</template>
      </KpiCard>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div class="flex items-center justify-between text-sm text-white/60">
          <span>Wochenverlauf</span>
          <div class="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-white/40">
            {{ weeklyTotal }} steps
          </div>
        </div>
        <EChart :options="weeklyChart" height="320px" class="mt-4" />
      </div>
      <div class="rounded-3xl border border-white/10 bg-gradient-to-br from-aurora/20 to-pulse/10 p-6 space-y-4">
        <div class="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-white/60">
          <span>Tagesziel</span>
          <span>{{ dailyTarget?.target.toLocaleString('de-DE') ?? '-' }} Schritte</span>
        </div>
        <div class="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm space-y-3">
          <div class="flex items-center justify-between text-white/80">
            <span>Heute</span>
            <span>{{ overview?.today.steps.toLocaleString('de-DE') ?? 0 }}</span>
          </div>
          <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              class="h-full bg-aurora transition-all"
              :style="{ width: targetProgress + '%' }"
            ></div>
          </div>
          <div class="flex items-center justify-between text-white/60">
            <span>Ø letzte 7 Tage</span>
            <span>{{ overview?.today.average7.toLocaleString('de-DE') ?? 0 }}</span>
          </div>
          <div class="flex items-center justify-between text-white/60">
            <span>Ziel erreicht (7 Tage)</span>
            <span>{{ dailyTarget?.achievedDays ?? 0 }}/7</span>
          </div>
        </div>
        <p class="text-sm text-white/70">
          {{ dailyTarget?.message ?? 'Wir passen dein Ziel automatisch an deine Leistung an.' }}
        </p>
      </div>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p class="text-xs uppercase tracking-[0.4em] text-white/60">Kalorien heute</p>
        <p class="mt-4 text-4xl font-display text-white">
          {{ insights?.todayCalories?.toLocaleString('de-DE') ?? '0' }} kcal
        </p>
        <p class="mt-2 text-sm text-white/60">
          Direkt aus deinem Kaloriensensor – volle Details im Kalorien-Tab.
        </p>
      </div>
      <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p class="text-xs uppercase tracking-[0.4em] text-white/60">Aktuelles Gewicht</p>
        <p class="mt-4 text-4xl font-display text-white">
          {{ weightDisplay }}
        </p>
        <p class="mt-2 text-sm text-white/60">
          Zuletzt gemessen: {{ weightDateLabel }}
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
const dailyTarget = computed(() => overview.value?.dailyTarget);
const insights = computed(() => overview.value?.insights);

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

const targetProgress = computed(() => {
  if (!overview.value || !overview.value.dailyTarget) return 0;
  const { steps } = overview.value.today;
  const { target } = overview.value.dailyTarget;
  if (!target) return 0;
  return Math.min(100, Math.round((steps / target) * 100));
});

const weightDisplay = computed(() => {
  const weight = insights.value?.weight;
  if (!weight) return '–';
  return `${weight.toFixed(1)} kg`;
});

const weightDateLabel = computed(() => {
  const label = insights.value?.weightDate;
  return label ?? 'Keine Messung';
});
</script>
