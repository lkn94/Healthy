<template>
  <section class="space-y-8">
    <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 class="text-2xl font-display">SmartHome Genesis</h2>
      <p class="text-white/60">Sammle Energie-, Automations- und KI-Punkte und erweitere dein digitales Zuhause.</p>
      <div class="mt-6 grid gap-6 md:grid-cols-3 text-center">
        <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p class="text-xs uppercase tracking-[0.4em] text-white/60">Energie</p>
          <p class="text-3xl font-display text-white">{{ collections.energyPoints.toLocaleString('de-DE') }}</p>
        </div>
        <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p class="text-xs uppercase tracking-[0.4em] text-white/60">Automation</p>
          <p class="text-3xl font-display text-white">{{ collections.automationPoints }}</p>
        </div>
        <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p class="text-xs uppercase tracking-[0.4em] text-white/60">KI-Punkte</p>
          <p class="text-3xl font-display text-white">{{ collections.aiPoints }}</p>
        </div>
      </div>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      <div
        v-for="module in collections.inventory"
        :key="module.id"
        class="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-3"
      >
        <div class="flex items-center justify-between text-sm text-white/60">
          <span>{{ module.title }}</span>
          <span v-if="module.unlocked" class="text-aurora">Freigeschaltet</span>
          <span v-else class="text-white/50">Noch gesperrt</span>
        </div>
        <p class="text-white/70 text-sm">{{ module.description }}</p>
        <div class="space-y-2 text-xs text-white/60">
          <CollectionProgress label="Energie" :value="module.progress.energy" />
          <CollectionProgress label="Automation" :value="module.progress.automation" />
          <CollectionProgress label="KI" :value="module.progress.ai" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useDashboardStore } from '../stores/dashboard';
import CollectionProgress from '../components/collections/CollectionProgress.vue';

const dashboard = useDashboardStore();

onMounted(() => {
  dashboard.loadCollections();
});

const collections = computed(() => dashboard.collections ?? {
  energyPoints: 0,
  automationPoints: 0,
  aiPoints: 0,
  inventory: []
});
</script>
