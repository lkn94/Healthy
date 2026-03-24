<template>
  <section class="space-y-8">
    <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 class="text-2xl font-display">Freigeschaltet</h2>
      <p class="text-white/60">Abzeichen, die du bereits erreicht hast.</p>
      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="challenge in unlocked"
          :key="challenge.id"
          class="rounded-3xl border border-aurora/40 bg-aurora/10 p-5 shadow-glow"
        >
          <p class="text-xs uppercase tracking-[0.4em] text-aurora/70">Freigeschaltet</p>
          <h3 class="mt-2 text-xl font-display">{{ challenge.title }}</h3>
          <p class="text-white/70 text-sm mt-2">{{ challenge.description }}</p>
        </div>
        <p v-if="!unlocked.length" class="text-sm text-white/60 col-span-full">
          Noch keine Challenge geschafft – leg heute los!
        </p>
      </div>
    </div>

    <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 class="text-2xl font-display">In Arbeit</h2>
      <p class="text-white/60">Abzeichen, die du als nächstes knacken kannst.</p>
      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="challenge in locked"
          :key="challenge.id"
          class="rounded-3xl border border-white/10 bg-black/20 p-5"
        >
          <p class="text-xs uppercase tracking-[0.4em] text-white/50">Noch offen</p>
          <h3 class="mt-2 text-xl font-display">{{ challenge.title }}</h3>
          <p class="text-white/70 text-sm mt-2">{{ challenge.description }}</p>
          <div class="mt-4 text-sm text-white/60">
            <p v-for="item in formatCriteria(challenge)" :key="item.key">
              {{ item.label }} • Ziel {{ item.target.toLocaleString('de-DE') }} ⇢ aktuell
              {{ item.current.toLocaleString('de-DE') }}
            </p>
          </div>
        </div>
        <p v-if="!locked.length" class="text-sm text-white/60 col-span-full">
          Keine offenen Herausforderungen – du bist nicht zu bremsen!
        </p>
      </div>
    </div>

    <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 class="text-2xl font-display">Tages-Challenges</h2>
      <p class="text-white/60">Meistere tägliche Ziele und stufe dich hoch.</p>
      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <div
          v-for="challenge in daily"
          :key="challenge.id"
          class="rounded-3xl border border-white/10 bg-black/20 p-5"
        >
          <div class="flex items-center justify-between text-sm text-white/60">
            <span>{{ challenge.label }}</span>
            <span>Level {{ challenge.level + 1 }}</span>
          </div>
          <p class="text-3xl font-display text-white mt-2">
            {{ challenge.currentValue.toLocaleString('de-DE') }} / {{ challenge.target.toLocaleString('de-DE') }}
          </p>
          <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden mt-4">
            <div
              class="h-full bg-aurora transition-all"
              :style="{ width: Math.min(100, Math.round((challenge.currentValue / challenge.target) * 100)) + '%' }"
            ></div>
          </div>
          <p class="text-sm text-white/60 mt-3" v-if="challenge.completed">
            Ziel für heute erreicht! Morgen wartet Level {{ challenge.level + 2 }}.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useChallengesStore } from '../stores/challenges';

const store = useChallengesStore();
const { unlocked, locked, daily } = storeToRefs(store);

onMounted(() => {
  store.fetchChallenges();
  store.fetchDailyChallenges();
});

const formatCriteria = (challenge: { criteria: Record<string, number>; progress: Record<string, number> }) => {
  const labels: Record<string, string> = {
    totalSteps: 'Schritte',
    longestStreak: 'Serie',
    bestWeekSteps: 'Beste Woche'
  };

  return Object.entries(challenge.criteria).map(([key, target]) => ({
    key,
    label: labels[key] ?? key,
    target,
    current: challenge.progress[key] ?? 0
  }));
};
</script>
