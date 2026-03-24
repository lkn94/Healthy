<template>
  <section class="space-y-8">
    <div class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div class="flex items-center justify-between text-sm text-white/60">
          <span>Gewicht 30 Tage</span>
          <span>Ø {{ body?.averageWeight ?? '–' }} kg</span>
        </div>
        <EChart :options="weightChart" height="300px" class="mt-4" />
      </div>
      <div class="rounded-3xl border border-white/10 bg-gradient-to-br from-aurora/20 to-midnight p-6">
        <p class="text-xs uppercase tracking-[0.4em] text-white/50">Active Minutes</p>
        <p class="mt-4 text-4xl font-display">{{ activeMinutesTotal }}</p>
        <p class="mt-2 text-white/60">Summe der letzten 30 Tage</p>
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
  dashboard.loadBody();
});

const body = computed(() => dashboard.body);

const weightChart = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 10, right: 10, top: 10, bottom: 30, containLabel: true },
  xAxis: {
    type: 'category',
    data: body.value?.trend.map((item) => item.date.substring(5)) ?? [],
    axisLabel: { color: '#8b90a8' }
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#8b90a8' },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
  },
  series: [
    {
      name: 'Gewicht',
      data: body.value?.trend.map((item) => item.weight ?? null) ?? [],
      type: 'line',
      smooth: true,
      lineStyle: { color: '#37F2C0', width: 3 }
    }
  ]
}));

const activeMinutesTotal = computed(() => body.value?.trend.reduce((sum, day) => sum + (day.activeMinutes ?? 0), 0) ?? 0);
</script>
