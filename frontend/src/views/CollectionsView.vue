<template>
  <section class="space-y-8">
    <div class="rounded-3xl border border-white/10 bg-gradient-to-r from-midnight to-eclipse p-6 flex flex-col gap-6 md:flex-row md:items-center">
      <div class="flex-1 space-y-3">
        <p class="text-xs uppercase tracking-[0.4em] text-white/60">SmartHome Genesis</p>
        <h2 class="text-3xl font-display">{{ heroTitle }}</h2>
        <p class="text-white/70">{{ heroMessage }}</p>
        <p class="text-xs text-white/50">
          Energie entsteht durch Schritte, Automation durch Tages-Challenges und KI-Punkte über große Lifetime-Meilensteine.
          Jede neue Stufe schaltet sichtbare Module in deinem virtuellen Zuhause frei.
        </p>
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

    <div class="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
      <h3 class="text-xl font-display">Blueprint</h3>
      <p class="text-white/60 text-sm">
        Dein Zuhause wächst sichtbar: jedes Modul besitzt einen Raum im Grundriss. Freigeschaltete Bereiche leuchten, gesperrte bleiben transparent.
      </p>
      <div class="blueprint-wrapper">
        <div class="blueprint-plan">
          <div
            v-for="slot in blueprintSlots"
            :key="slot.id"
            class="blueprint-room"
            :style="{ gridArea: slot.area }"
            :class="slot.module?.unlocked ? 'room-active' : 'room-locked'"
          >
            <div class="room-content">
              <div class="room-icon">{{ slot.module?.icon ?? slot.fallbackIcon }}</div>
              <div>
                <p class="text-xs" :class="slot.module?.unlocked ? 'text-aurora' : 'text-white/50'">
                  {{ slot.module?.unlocked ? 'Aktiv' : 'In Bau' }}
                </p>
                <p class="text-white font-display text-sm">{{ slot.module?.title ?? slot.fallbackTitle }}</p>
              </div>
            </div>
            <p class="text-[11px] text-white/70" v-if="slot.module?.story && slot.module?.unlocked">{{ slot.module.story }}</p>
            <div class="mt-2 space-y-1 text-[11px]" v-if="slot.module">
              <CollectionProgress label="Energie" :value="slot.module.progress.energy" />
              <CollectionProgress label="Automation" :value="slot.module.progress.automation" />
              <CollectionProgress label="KI" :value="slot.module.progress.ai" />
            </div>
            <p class="text-[11px] text-white/60" v-if="slot.module && !slot.module.unlocked">
              Noch {{ remainingText(slot.module) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-3xl border border-white/10 bg-white/5 p-6" v-if="nextModule">
      <h3 class="text-xl font-display">Nächster Raum entsteht</h3>
      <p class="text-white/60 text-sm">
        Sobald du genug Punkte hast, baut EVA {{ nextModule.title }} und bringt neue Funktionen wie:
      </p>
      <ul class="list-disc list-inside text-white/70 text-sm mt-3">
        <li v-if="nextModule.key === 'smart-lighting'">Adaptives Licht passend zu Tageszeit.</li>
        <li v-else-if="nextModule.key === 'climate-core'">Auto-Klima mit Luftqualitäts-Checks.</li>
        <li v-else-if="nextModule.key === 'security-hub'">Smarte Sicherheits-Sensorik.</li>
        <li v-else-if="nextModule.key === 'automation-brain'">Predictive Routinen für Alltag.</li>
        <li v-else-if="nextModule.key === 'ai-companion'">KI-Companion liefert persönliche Insights.</li>
        <li v-else>Neue SmartHome-Funktionalität.</li>
      </ul>
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

const moduleByKey = (key: string) => collections.value.inventory.find((module) => module.key === key);

const blueprintSlots = computed(() => [
  { id: 'slot-command', area: 'base', fallbackTitle: 'Basiszentrum', fallbackIcon: '🏠', module: moduleByKey('command-center') },
  { id: 'slot-light', area: 'living', fallbackTitle: 'Lichtdeck', fallbackIcon: '💡', module: moduleByKey('smart-lighting') },
  { id: 'slot-climate', area: 'climate', fallbackTitle: 'Klima-Hub', fallbackIcon: '🌡️', module: moduleByKey('climate-core') },
  { id: 'slot-security', area: 'security', fallbackTitle: 'Security', fallbackIcon: '🛡️', module: moduleByKey('security-hub') },
  { id: 'slot-automation', area: 'automation', fallbackTitle: 'Automation Brain', fallbackIcon: '🧠', module: moduleByKey('automation-brain') },
  { id: 'slot-ai', area: 'ai', fallbackTitle: 'KI-Companion', fallbackIcon: '🤖', module: moduleByKey('ai-companion') }
]);

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

<style scoped>
.blueprint-wrapper {
  overflow-x: auto;
}

.blueprint-plan {
  min-height: 320px;
  display: grid;
  grid-template-columns: repeat(3, minmax(140px, 1fr));
  grid-template-rows: repeat(2, 160px);
  grid-template-areas:
    'base living climate'
    'security automation ai';
  gap: 16px;
  background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.08), transparent 60%);
  padding: 16px;
  border-radius: 24px;
  position: relative;
}

.blueprint-plan::after {
  content: '';
  position: absolute;
  inset: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  pointer-events: none;
}

.blueprint-room {
  position: relative;
  border-radius: 18px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.blueprint-room.room-active {
  border-color: rgba(55, 242, 192, 0.6);
  box-shadow: 0 10px 25px rgba(55, 242, 192, 0.2);
  background: rgba(55, 242, 192, 0.08);
}

.blueprint-room.room-locked {
  opacity: 0.85;
}

.room-content {
  display: flex;
  gap: 10px;
  align-items: center;
}

.room-icon {
  height: 48px;
  width: 48px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
}

@media (max-width: 640px) {
  .blueprint-plan {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
    grid-template-areas:
      'base living'
      'climate security'
      'automation ai';
    grid-template-rows: repeat(3, 160px);
  }
}
</style>
