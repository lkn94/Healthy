<template>
  <section class="space-y-8">
    <div class="grid gap-6 md:grid-cols-3">
      <KpiCard>
        <template #label>Gesamt kcal</template>
        {{ calories?.totals.totalCalories.toLocaleString('de-DE') ?? '–' }}
        <template #description>Seit Beginn</template>
      </KpiCard>
      <KpiCard>
        <template #label>Ø pro Tag</template>
        {{ calories?.totals.averageCalories.toLocaleString('de-DE') ?? '–' }}
        <template #description>Durchschnittliche Verbrennung</template>
      </KpiCard>
      <KpiCard>
        <template #label>Mahlzeiten Äquivalent</template>
        {{ calories?.totals.totalMeals ?? 0 }}
        <template #description>Basis {{ calories?.totals.baseMealCalories ?? 0 }} kcal</template>
      </KpiCard>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div class="flex items-center justify-between text-sm text-white/60">
          <span>Kalorienverlauf (letzte 30 Tage)</span>
          <span>Ø {{ calories?.totals.averageCalories ?? 0 }} kcal</span>
        </div>
        <EChart :options="calorieChart" height="320px" class="mt-4" />
      </div>
      <div class="rounded-3xl border border-white/10 bg-gradient-to-br from-pulse/20 to-midnight p-6 space-y-4">
        <div>
          <p class="text-xs uppercase tracking-[0.4em] text-white/50">Heute</p>
          <p class="text-4xl font-display text-white">
            {{ calories?.today?.calories?.toLocaleString('de-DE') ?? 0 }} kcal
          </p>
          <p class="text-sm text-white/60 mt-2">
            Entspricht ca. {{ todayMealCount }} × {{ calories?.today?.mealEquivalent?.label ?? 'Mahlzeit' }}
          </p>
        </div>
        <p class="text-sm text-white/70">
          Jede Bewegung zählt – verbrannte Kalorien entsprechen deinem Lieblingsessen. Heute hast du dir
          {{ (calories?.today?.mealEquivalent?.label ?? 'eine Mahlzeit').toLowerCase() }} erlaufen.
        </p>
      </div>
    </div>

    <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 class="text-xl font-display">Vergleichswerte</h3>
      <p class="text-white/60">So viele kcal besitzen typische Mahlzeiten.</p>
      <div class="mt-4 grid gap-4 md:grid-cols-4">
        <div
          v-for="reference in calories?.references ?? []"
          :key="reference.id"
          class="rounded-2xl border border-white/10 bg-black/20 p-4"
        >
          <p class="text-sm text-white/70">{{ reference.label }}</p>
          <p class="text-2xl font-display text-white">{{ reference.calories }} kcal</p>
        </div>
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
  dashboard.loadCalories();
});

const calories = computed(() => dashboard.calories);

const calorieChart = computed(() => {
  const series = calories.value?.series ?? [];
  const recent = series.slice(-30);
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 10, right: 10, top: 10, bottom: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: recent.map((item) => item.date.substring(5)),
      axisLabel: { color: '#8b90a8' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#8b90a8' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
    },
    series: [
      {
        name: 'Kalorien',
        data: recent.map((item) => item.calories),
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#FF7D96', width: 3 },
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
  };
});

const todayMealCount = computed(() => {
  if (!calories.value || !calories.value.today?.mealEquivalent) return '0';
  return calories.value.today.mealEquivalent.count.toFixed(1);
});
</script>
