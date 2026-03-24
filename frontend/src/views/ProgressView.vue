<template>
  <section class="space-y-8">
    <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div class="flex items-center justify-between text-sm text-white/60">
        <span>30-Tage Performance</span>
        <span>{{ total30 }} Schritte</span>
      </div>
      <EChart :options="lineChart" height="320px" class="mt-4" />
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div class="flex items-center justify-between text-sm text-white/60">
          <span>Heatmap 120 Tage</span>
          <span>Highlight deiner Aktivität</span>
        </div>
        <EChart :options="heatmapOptions" height="280px" class="mt-4" />
      </div>
      <div class="rounded-3xl border border-white/10 bg-gradient-to-br from-pulse/20 to-midnight p-6 space-y-4">
        <div>
          <p class="text-xs uppercase tracking-[0.4em] text-white/50">Bester Tag</p>
          <p class="text-4xl font-display text-white">{{ records.bestDaySteps }}</p>
          <p class="text-sm text-white/60">{{ records.bestDayDate }}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-[0.4em] text-white/50">Beste Woche</p>
          <p class="text-4xl font-display text-white">{{ records.bestWeekSteps }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useDashboardStore } from '../stores/dashboard';
import EChart from '../components/charts/EChart.vue';

const dashboard = useDashboardStore();

onMounted(() => {
  dashboard.loadProgress();
});

const progress = computed(() => dashboard.progress);

const total30 = computed(
  () => progress.value?.last30.reduce((sum, item) => sum + item.steps, 0) ?? 0
);

const lineChart = computed(() => ({
  grid: { left: 10, right: 10, top: 20, bottom: 30, containLabel: true },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: progress.value?.last30.map((item) => item.date.substring(5)) ?? [],
    axisLabel: { color: '#8b90a8' }
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#8b90a8' },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
  },
  series: [
    {
      name: 'Schritte',
      data: progress.value?.last30.map((item) => item.steps) ?? [],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#ff7d96', width: 3 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(255,125,150,0.4)' },
            { offset: 1, color: 'rgba(10,10,26,0)' }
          ]
        }
      }
    }
  ]
}));

const heatmapOptions = computed(() => {
  const items = progress.value?.heatmap ?? [];
  const baseDate = items.length ? new Date(items[0].date) : new Date();
  const weekCount = Math.ceil(items.length / 7);
  const data = items.map((item) => {
    const date = new Date(item.date);
    const diffDays = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(diffDays / 7);
    return [date.getDay(), weekIndex, item.steps];
  });
  return {
    tooltip: { position: 'top' },
    grid: { top: 20, left: 20, right: 20, bottom: 20 },
    xAxis: {
      type: 'category',
      data: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
      axisLabel: { color: '#8b90a8' },
      splitArea: { show: true }
    },
    yAxis: {
      type: 'category',
      data: Array.from({ length: weekCount }).map((_, idx) => `W${idx + 1}`),
      axisLabel: { show: false },
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: Math.max(...(progress.value?.heatmap.map((item) => item.steps) ?? [10000])),
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: ['#101326', '#37F2C0'] }
    },
    series: [
      {
        name: 'Schritte',
        type: 'heatmap',
        data,
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } }
      }
    ]
  };
});

const records = computed(() => progress.value?.records ?? { bestDaySteps: 0, bestDayDate: '-', bestWeekSteps: 0 });
</script>
