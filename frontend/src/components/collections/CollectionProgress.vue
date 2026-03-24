<template>
  <div class="space-y-1">
    <div class="flex items-center justify-between text-xs text-white/60">
      <span>{{ label }}</span>
      <span>{{ Math.round(value * 100) }}%</span>
    </div>
    <div class="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
      <div
        class="h-full bg-gradient-to-r from-aurora to-pulse transition-all"
        :style="{ width: Math.min(100, Math.round(value * 100)) + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: number }>();
</script>
