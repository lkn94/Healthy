<template>
  <div>
    <div class="flex items-center justify-between">
      <span>{{ label }}</span>
      <span>{{ Math.round(value * 100) }}%</span>
    </div>
    <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden mt-1">
      <div class="h-full bg-aurora" :style="{ width: Math.min(100, Math.round(value * 100)) + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: number }>();
</script>
