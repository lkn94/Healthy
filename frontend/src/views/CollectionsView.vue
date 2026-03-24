<template>
  <section class="space-y-8">
    <div class="rounded-3xl border border-white/10 bg-gradient-to-r from-midnight to-eclipse p-6 flex flex-col gap-6 md:flex-row md:items-center">
      <div class="flex-1 space-y-3">
        <p class="text-xs uppercase tracking-[0.4em] text-white/60">SmartHome Genesis</p>
        <h2 class="text-3xl font-display">{{ heroTitle }}</h2>
        <p class="text-white/70">{{ heroMessage }}</p>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div class="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p class="text-xs uppercase tracking-[0.4em] text-white/60">Energie</p>
            <p class="text-2xl font-display text-white">{{ collections.energyPoints.toLocaleString('de-DE') }}</p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p class="text-xs uppercase tracking-[0.4em] text-white/60">Automation</p>
            <p class="text-2xl font-display text-white">{{ collections.automationPoints }}</p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p class="text-xs uppercase tracking-[0.4em] text-white/60">KI</p>
            <p class="text-2xl font-display text-white">{{ collections.aiPoints }}</p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-4 rounded-3xl border border-white/10 bg-black/30 p-4">
        <div class="h-16 w-16 rounded-full bg-aurora/20 flex items-center justify-center text-3xl">🤖</div>
        <div>
          <p class="text-sm text-white/60">EVA · KI-Begleiterin</p>
          <p class="text-white/80">{{ evaMessage }}</p>
        </div>
      </div>
    </div>

    <div class="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
      <h3 class="text-xl font-display">Wie sammle ich Punkte?</h3>
      <ul class="list-disc list-inside text-white/70 text-sm space-y-1">
        <li><span class="text-aurora">Energiepunkte</span> entstehen durch jeden Schritt.</li>
        <li><span class="text-aurora">Automationspunkte</span> gewinnst du über Tages-Challenges.</li>
        <li><span class="text-aurora">KI-Punkte</span> sammelst du mit großen Lifetime-Challenges.</li>
      </ul>
      <p class="text-white/60 text-sm">Jedes Modul benötigt eine Kombination dieser Punkte. Sobald der Fortschrittsbalken voll ist, wird es freigeschaltet.</p>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      <div
        v-for="module in collections.inventory"
        :key="module.id"
        class="rounded-3xl border border-white/10 p-5 space-y-3 transition shadow-lg"
        :class="module.unlocked ? 'bg-aurora/15 border-aurora/30' : 'bg-white/5'"
      >
        <div class="flex items-center gap-3">
          <div class="h-12 w-12 rounded-2xl bg-black/30 flex items-center justify-center text-2xl">
            {{ module.icon ?? '🏠' }}
          </div>
          <div>
            <p class="text-sm text-white/60">{{ module.unlocked ? 'Aktiv' : 'In Arbeit' }}</p>
            <h3 class="text-xl font-display">{{ module.title }}</h3>
          </div>
        </div>
        <p class="text-white/70 text-sm">{{ module.description }}</p>
        <p v-if="module.story && module.unlocked" class="text-aurora text-sm">{{ module.story }}</p>
        <div class="space-y-2 text-xs text-white/60">
          <CollectionProgress label="Energie" :value="module.progress.energy" />
          <CollectionProgress label="Automation" :value="module.progress.automation" />
          <CollectionProgress label="KI" :value="module.progress.ai" />
        </div>
        <p v-if="!module.unlocked" class="text-xs text-white/60">
          Noch {{ remainingText(module) }} bis zur Aktivierung.
        </p>
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

const collections = computed(() =>
  dashboard.collections ?? {
    energyPoints: 0,
    automationPoints: 0,
    aiPoints: 0,
    inventory: []
  }
);

const nextModule = computed(() => collections.value.inventory.find((module) => !module.unlocked));

const heroTitle = computed(() =>
  nextModule.value ? `Nächste Mission: ${nextModule.value.title}` : 'Alle Module aktiviert'
);

const heroMessage = computed(() =>
  nextModule.value
    ? `Sammle Ressourcen, um ${nextModule.value.title} freizuschalten und dein Zuhause weiter zu vernetzen.`
    : 'Dein SmartHome läuft auf Maximum. EVA sammelt weiterhin Punkte für künftige Erweiterungen.'
);

const evaMessage = computed(() => {
  if (!nextModule.value) {
    return 'Ich beobachte deine Energie – bereit für die nächste Generation.';
  }
  const energyShort = Math.max(0, nextModule.value.requiredEnergy - collections.value.energyPoints);
  const autoShort = Math.max(0, nextModule.value.requiredAutomation - collections.value.automationPoints);
  const aiShort = Math.max(0, nextModule.value.requiredAI - collections.value.aiPoints);
  return `Noch ${energyShort.toLocaleString('de-DE')} Energie • ${autoShort} Automation • ${aiShort} KI für ${nextModule.value.title}.`;
});

const remainingText = (module: (typeof collections.value.inventory)[number]) => {
  const energyShort = Math.max(0, module.requiredEnergy - collections.value.energyPoints);
  const autoShort = Math.max(0, module.requiredAutomation - collections.value.automationPoints);
  const aiShort = Math.max(0, module.requiredAI - collections.value.aiPoints);
  const parts = [];
  if (energyShort > 0) parts.push(`${energyShort.toLocaleString('de-DE')} Energie`);
  if (autoShort > 0) parts.push(`${autoShort} Automation`);
  if (aiShort > 0) parts.push(`${aiShort} KI`);
  return parts.join(' • ');
};
</script>
