<template>
  <div class="min-h-screen bg-midnight text-white flex flex-col lg:flex-row">
    <div class="lg:hidden border-b border-white/10 bg-gradient-to-r from-eclipse to-midnight p-4 flex items-center justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.4em] text-white/50">Health</p>
        <p class="text-xl font-display font-semibold">Dashboard</p>
      </div>
      <button
        class="h-10 w-10 rounded-2xl border border-white/20 flex items-center justify-center"
        @click="toggleMobileMenu"
      >
        <span v-if="!mobileMenuOpen">☰</span>
        <span v-else>×</span>
      </button>
    </div>
    <transition name="mobile-menu-fade">
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        @click="closeMobileMenu"
      ></div>
    </transition>
    <aside
      class="lg:flex w-72 flex-col border-r border-white/5 bg-gradient-to-b from-eclipse/60 to-midnight/80 backdrop-blur-xl transition-transform duration-300 ease-out"
      :class="mobileMenuOpen ? 'fixed inset-y-0 left-0 z-50 w-[82%] max-w-sm shadow-2xl translate-x-0' : 'hidden -translate-x-full lg:flex lg:translate-x-0'"
    >
      <div class="px-8 py-10">
        <div class="flex items-center gap-3">
          <div class="h-12 w-12 rounded-2xl bg-aurora/20 flex items-center justify-center text-2xl font-bold text-aurora">
            HD
          </div>
          <div>
            <p class="text-sm uppercase tracking-[0.4em] text-white/50">Health</p>
            <p class="text-xl font-display font-semibold">Dashboard</p>
          </div>
        </div>
        <p class="mt-6 text-sm text-white/60">
          Synchronisiere Home Assistant Daten, beobachte deine Fortschritte und bleib im Flow.
        </p>
      </div>
      <nav class="flex-1 px-4 space-y-2">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition"
          :class="
            route.name === item.name
              ? 'bg-white/10 text-white shadow-glow'
              : 'text-white/60 hover:bg-white/5 hover:text-white'
          "
          @click="handleNavClick"
        >
          <component :is="item.icon" class="h-5 w-5" />
          {{ item.label }}
          <span v-if="item.badge" class="ml-auto text-xs text-aurora">{{ item.badge }}</span>
        </RouterLink>
      </nav>
      <div class="p-6">
        <div class="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p class="text-sm text-white/70">Aktuelle Serie</p>
          <p class="text-4xl font-display text-aurora">{{ streakLabel }}</p>
          <p class="text-xs text-white/60 mt-2">Halte die Energie – tägliche Syncs halten deine Serie am Leben.</p>
        </div>
        <button
          class="mt-6 w-full rounded-2xl bg-pulse/90 px-4 py-3 text-sm font-semibold text-white hover:bg-pulse"
          @click="handleLogout"
        >
          Abmelden
        </button>
      </div>
    </aside>
    <div class="flex-1 flex flex-col">
      <header class="px-6 lg:px-12 py-8 flex flex-col gap-6 border-b border-white/5 bg-gradient-to-r from-eclipse to-midnight">
        <div class="flex flex-col lg:flex-row lg:items-center gap-4">
          <div>
            <p class="text-sm uppercase tracking-[0.4em] text-white/50">Willkommen zurück</p>
            <h1 class="text-3xl font-display font-semibold">{{ auth.user?.displayName ?? 'Athlet' }}</h1>
          </div>
          <div class="flex-1 flex flex-wrap gap-4 text-xs text-white/70">
            <div class="flex-1 min-w-[140px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p class="uppercase tracking-widest text-white/50">Verbindungen</p>
              <p class="text-2xl font-display">{{ connectionCount }}</p>
            </div>
            <div class="flex-1 min-w-[140px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p class="uppercase tracking-widest text-white/50">Letzter Sync</p>
              <p class="text-2xl font-display">{{ lastSyncLabel }}</p>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-6 text-white/60">
            <span class="hidden md:block">Version 1.0</span>
            <span>{{ new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) }}</span>
          </div>
          <RouterLink to="/settings" class="text-aurora hover:text-white text-sm">Einstellungen</RouterLink>
        </div>
      </header>
      <main class="flex-1 bg-gradient-to-b from-midnight to-black/90 px-4 py-6 sm:px-8 lg:px-14">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed, ref, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useConnectionsStore } from '../stores/connections';
import { ChartBarIcon, SparklesIcon, ClockIcon, Cog6ToothIcon, HeartIcon, FlagIcon, FireIcon, BuildingOfficeIcon, TrophyIcon } from '@heroicons/vue/24/outline';

const route = useRoute();
const auth = useAuthStore();
const connections = useConnectionsStore();
const mobileMenuOpen = ref(false);

const streakLabel = computed(() => `${connections.lifetimeStats.longestStreak ?? 0} Tage`);
const connectionCount = computed(() => connections.connections.length);
const lastSyncLabel = computed(() => {
  const lastSync = connections.connections
    .map((c) => c.lastSyncAt)
    .filter(Boolean)
    .sort()
    .pop();
  if (!lastSync) return '–';
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(lastSync));
});

const navItems = [
  { name: 'overview', label: 'Übersicht', to: '/overview', icon: SparklesIcon },
  { name: 'progress', label: 'Fortschritt', to: '/progress', icon: ChartBarIcon },
  { name: 'lifetime', label: 'Lebensleistung', to: '/lifetime', icon: ClockIcon },
  { name: 'calories', label: 'Kalorien', to: '/calories', icon: FireIcon },
  { name: 'collections', label: 'Collections', to: '/collections', icon: BuildingOfficeIcon },
  { name: 'challenges', label: 'Herausforderungen', to: '/challenges', icon: FlagIcon },
  { name: 'leaderboard', label: 'Bestenliste', to: '/leaderboard', icon: TrophyIcon },
  { name: 'body', label: 'Körper & Regeneration', to: '/body', icon: HeartIcon, badge: 'Live' },
  { name: 'settings', label: 'Einstellungen', to: '/settings', icon: Cog6ToothIcon }
];

const handleLogout = () => {
  auth.logout();
};

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
};

const handleNavClick = () => {
  if (mobileMenuOpen.value) {
    closeMobileMenu();
  }
};

watch(
  () => route.fullPath,
  () => {
    if (mobileMenuOpen.value) {
      closeMobileMenu();
    }
  }
);

if (!connections.loaded) {
  connections.fetchConnections();
  connections.fetchLifetimeStats();
}
</script>

<style scoped>
.mobile-menu-fade-enter-active,
.mobile-menu-fade-leave-active {
  transition: opacity 0.25s ease;
}

.mobile-menu-fade-enter-from,
.mobile-menu-fade-leave-to {
  opacity: 0;
}
</style>
