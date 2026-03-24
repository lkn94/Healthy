<template>
  <div class="min-h-screen bg-midnight text-white flex items-center justify-center px-4 py-10">
    <div class="grid w-full max-w-5xl grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-eclipse via-[#090f24] to-midnight shadow-2xl">
      <div class="p-10 lg:p-14 flex flex-col gap-10">
        <div>
          <p class="text-sm uppercase tracking-[0.4em] text-white/50">Health Dashboard</p>
          <h1 class="mt-4 text-4xl font-display font-semibold leading-tight">
            {{ isLogin ? 'Willkommen zurück.' : 'Starte deine Umlaufbahn.' }}
          </h1>
          <p class="mt-3 text-white/60">
            Verbinde Home Assistant in wenigen Sekunden, importiere History und erhalte ein persönliches Performance Cockpit.
          </p>
        </div>
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label class="text-xs uppercase tracking-[0.3em] text-white/50">E-Mail</label>
            <input
              v-model="form.email"
              type="email"
              required
              class="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-aurora focus:outline-none"
              placeholder="du@example.com"
            />
          </div>
          <div v-if="!isLogin">
            <label class="text-xs uppercase tracking-[0.3em] text-white/50">Name</label>
            <input
              v-model="form.displayName"
              type="text"
              required
              class="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-aurora focus:outline-none"
              placeholder="Athlet/in"
            />
          </div>
          <div>
            <label class="text-xs uppercase tracking-[0.3em] text-white/50">Passwort</label>
            <input
              v-model="form.password"
              type="password"
              required
              minlength="8"
              class="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 focus:border-aurora focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <p v-if="auth.error" class="text-sm text-pulse">{{ auth.error }}</p>
          <button
            type="submit"
            class="w-full rounded-2xl bg-gradient-to-r from-aurora to-pulse px-4 py-3 text-center text-sm font-semibold text-midnight shadow-glow"
            :disabled="auth.loading"
          >
            {{ isLogin ? 'Einloggen' : 'Account erstellen' }}
          </button>
        </form>
        <p class="text-sm text-white/60">
          {{ isLogin ? 'Noch kein Account?' : 'Bereits registriert?' }}
          <RouterLink :to="isLogin ? '/register' : '/login'" class="text-aurora">
            {{ isLogin ? 'Registrieren' : 'Einloggen' }}
          </RouterLink>
        </p>
      </div>
      <div class="hidden lg:flex flex-col justify-between bg-[radial-gradient(circle_at_top,#1a2b63,#090f24)] p-14">
        <div>
          <p class="text-xs uppercase tracking-[0.5em] text-white/50">LIVE-SYNC</p>
          <h2 class="mt-4 text-3xl font-display">Home Assistant + Lebensleistung</h2>
          <p class="mt-3 text-white/70">
            Automatische Aggregation, Heatmaps, Body Tracking und persönliche Streak-Algorithmen.
          </p>
        </div>
        <div class="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div class="flex justify-between text-xs tracking-widest text-white/50">
            <span>LETZTER IMPORT</span>
            <span>LIVE</span>
          </div>
          <div class="h-36 w-full rounded-2xl bg-gradient-to-br from-aurora/30 via-transparent to-pulse/20 flex items-center justify-center text-5xl font-display">
            84%
          </div>
          <p class="text-sm text-white/70">Automatische Scheduler synchronisieren alle 30 Minuten. Keine manuelle Pflege notwendig.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const isLogin = computed(() => (route.meta.mode as string) !== 'register');

const form = reactive({
  email: '',
  password: '',
  displayName: ''
});

const handleSubmit = async () => {
  try {
    if (isLogin.value) {
      await auth.login({ email: form.email, password: form.password });
    } else {
      await auth.register({
        email: form.email,
        password: form.password,
        displayName: form.displayName
      });
    }
    router.push({ name: 'overview' });
  } catch (error) {
    console.error(error);
  }
};
</script>
