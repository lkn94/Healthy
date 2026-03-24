<template>
  <section class="space-y-8">
    <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 class="text-2xl font-display">Freigeschaltet</h2>
      <p class="text-white/60">Badges, die du bereits erreicht hast.</p>
      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="challenge in unlocked"
          :key="challenge.id"
          class="rounded-3xl border border-aurora/40 bg-aurora/10 p-5 shadow-glow"
        >
          <p class="text-xs uppercase tracking-[0.4em] text-aurora/70">Unlocked</p>
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
      <p class="text-white/60">Badges, die du als nächstes knacken kannst.</p>
      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="challenge in locked"
          :key="challenge.id"
          class="rounded-3xl border border-white/10 bg-black/20 p-5"
        >
          <p class="text-xs uppercase tracking-[0.4em] text-white/50">Lock</p>
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
          Keine offenen Challenges – du bist on fire!
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useChallengesStore } from '../stores/challenges';

const store = useChallengesStore();
const { unlocked, locked } = storeToRefs(store);

onMounted(() => {
  store.fetchChallenges();
});

const formatCriteria = (challenge: { criteria: Record<string, number>; progress: Record<string, number> }) => {
  const labels: Record<string, string> = {
    totalSteps: 'Steps',
    longestStreak: 'Streak',
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
