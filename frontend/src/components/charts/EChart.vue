<template>
  <div ref="chartRef" :style="{ height }" class="w-full"></div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts/core';
import { LineChart, BarChart, HeatmapChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  VisualMapComponent,
  DatasetComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';

echarts.use([
  LineChart,
  BarChart,
  HeatmapChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  VisualMapComponent,
  DatasetComponent,
  CanvasRenderer
]);

const props = defineProps<{ options: echarts.EChartsCoreOption; height?: string }>();

const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chart) {
    chart = echarts.init(chartRef.value);
  }
  chart.setOption(props.options, true);
};

onMounted(() => {
  renderChart();
  window.addEventListener('resize', renderChart);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', renderChart);
  chart?.dispose();
  chart = null;
});

watch(
  () => props.options,
  () => {
    renderChart();
  },
  { deep: true }
);

const height = props.height ?? '320px';
</script>
