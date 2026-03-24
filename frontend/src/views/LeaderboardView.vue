<template>
  <section class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-display">Bestenliste</h2>
        <p class="text-white/60 text-sm">Wer liefert heute die meisten Schritte? Wer führt insgesamt?</p>
      </div>
      <div class="flex gap-2">
        <button
          v-for="option in sortOptions"
          :key="option.value"
          class="px-4 py-2 rounded-2xl border text-sm"
          :class="option.value === store.sort ? 'border-aurora text-white' : 'border-white/20 text-white/60'"
          @click="changeSort(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div class="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-white/5 text-xs uppercase tracking-[0.3em] text-white/50">
          <tr>
            <th class="px-4 py-3">Rang</th>
            <th class="px-4 py-3">Nutzer</th>
            <th class="px-4 py-3">Schritte heute</th>
            <th class="px-4 py-3">Gesamt Schritte</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in store.entries" :key="entry.rank" class="border-t border-white/10">
            <td class="px-4 py-3 text-white/70">#{{ entry.rank }}</td>
            <td class="px-4 py-3 text-white">{{ entry.displayName }}</td>
            <td class="px-4 py-3 text-white/80">{{ entry.stepsToday.toLocaleString('de-DE') }}</td>
            <td class="px-4 py-3 text-white font-semibold">{{ entry.totalSteps.toLocaleString('de-DE') }}</td>
          </tr>
          <tr v-if="!store.entries.length && !store.loading">
            <td colspan="4" class="px-4 py-6 text-center text-white/50">Noch keine Teilnehmer.</td>
          </tr>
          <tr v-if="store.loading">
            <td colspan="4" class="px-4 py-6 text-center text-white/60">Lade...</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useLeaderboardStore } from '../stores/leaderboard';

const store = useLeaderboardStore();

const sortOptions = [
  { value: 'today' as const, label: 'Schritte heute' },
  { value: 'total' as const, label: 'Gesamt Schritte' }
];

const changeSort = (value: 'today' | 'total') => {
  if (store.sort === value) return;
  store.fetch(value);
};

onMounted(() => {
  store.fetch('total');
});
</script>
