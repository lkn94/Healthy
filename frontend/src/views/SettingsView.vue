<template>
  <section class="space-y-10">
    <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 class="text-2xl font-display">Verbindungen</h2>
      <p class="text-white/60">Kopple Home Assistant Instanzen und verschlüssele Tokens serverseitig.</p>
      <form class="mt-6 grid gap-4 md:grid-cols-3" @submit.prevent="createConnection">
        <input v-model="connectionForm.name" class="input" placeholder="Name" required />
        <input v-model="connectionForm.baseUrl" class="input" placeholder="Base URL" required />
        <input v-model="connectionForm.accessToken" class="input" placeholder="Langzeit-Token" required />
        <button type="submit" class="md:col-span-3 rounded-2xl bg-aurora/90 px-4 py-3 text-midnight font-semibold">
          Verbindung speichern
        </button>
      </form>
      <div class="mt-8 grid gap-4 md:grid-cols-2">
        <div v-for="connection in connections" :key="connection.id" class="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-lg font-display">{{ connection.name }}</p>
              <p class="text-xs text-white/50">{{ connection.baseUrl }}</p>
            </div>
            <span class="text-xs uppercase tracking-[0.4em] text-white/50">{{ connection.status }}</span>
          </div>
          <div class="mt-4 flex flex-wrap gap-2 text-sm">
            <button class="pill" @click="selectConnection(connection.id)">Sensoren</button>
            <button class="pill" @click="handleTest(connection.id)">Testen</button>
            <button class="pill" @click="handleSync(connection.id)">Sync auslösen</button>
            <button class="pill" @click="removeConnection(connection.id)">Löschen</button>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 class="text-2xl font-display">Privatsphäre & Bestenliste</h2>
      <p class="text-white/60">Bestimme, ob dein Name in der Bestenliste erscheint.</p>
      <div class="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-white/80 text-sm">
            {{ showOnLeaderboard ? 'Du bist aktuell sichtbar.' : 'Du bist aktuell verborgen.' }}
          </p>
          <p class="text-white/50 text-xs">Nur dein Anzeigename und die Schrittwerte werden gezeigt.</p>
        </div>
        <button
          class="rounded-2xl px-4 py-2 text-sm font-semibold border"
          :class="showOnLeaderboard ? 'border-pulse text-white' : 'border-white/30 text-white/70'"
          :disabled="settingsLoading"
          @click="toggleLeaderboardVisibility"
        >
          {{ showOnLeaderboard ? 'Verbergen' : 'Sichtbar werden' }}
        </button>
      </div>
    </div>

    <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 class="text-2xl font-display">Profil</h2>
      <p class="text-white/60">Aktualisiere deinen Anzeigenamen.</p>
      <form class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end" @submit.prevent="saveProfile">
        <label class="flex-1 text-sm text-white/70">
          <span>Anzeige-Name</span>
          <input v-model="profileForm.displayName" class="input mt-2" placeholder="Name" required />
        </label>
        <button
          class="rounded-2xl bg-aurora/90 px-4 py-3 text-sm font-semibold text-midnight"
          type="submit"
          :disabled="profileSaving"
        >
          {{ profileSaving ? 'Speichere...' : 'Speichern' }}
        </button>
      </form>
      <p v-if="profileMessage" class="mt-2 text-sm text-white/70">{{ profileMessage }}</p>
    </div>

    <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 class="text-2xl font-display">Passwort ändern</h2>
      <p class="text-white/60">Neues Passwort setzt dein aktuelles voraus.</p>
      <form class="mt-4 grid gap-4 md:grid-cols-3" @submit.prevent="savePassword">
        <label class="text-sm text-white/70">
          <span>Aktuelles Passwort</span>
          <input v-model="passwordForm.currentPassword" class="input mt-2" type="password" required />
        </label>
        <label class="text-sm text-white/70">
          <span>Neues Passwort</span>
          <input v-model="passwordForm.newPassword" class="input mt-2" type="password" required minlength="8" />
        </label>
        <div class="flex items-end">
          <button
            class="w-full rounded-2xl bg-gradient-to-r from-aurora to-pulse px-4 py-3 text-sm font-semibold text-midnight"
            type="submit"
            :disabled="passwordSaving"
          >
            {{ passwordSaving ? 'Aktualisiere...' : 'Passwort speichern' }}
          </button>
        </div>
      </form>
      <p v-if="passwordMessage" class="mt-2 text-sm text-white/70">{{ passwordMessage }}</p>
    </div>

    <div v-if="selectedConnection" class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 class="text-2xl font-display">Sensor-Zuordnung – {{ selectedConnection.name }}</h2>
      <p class="text-white/60">Wähle passende Sensoren für Schritte, Gewicht, Distanz und aktive Minuten.</p>
      <form class="mt-6 grid gap-4 md:grid-cols-2" @submit.prevent="saveMapping">
        <label class="md:col-span-2 space-y-2 text-sm text-white/70">
          <span>Sensoren filtern</span>
          <input v-model="entitySearch" class="input" placeholder="sensor.schritte oder Name" />
        </label>
        <label class="space-y-2 text-sm text-white/70">
          <span>Schritt-Sensor</span>
          <select v-model="mapping.stepsEntityId" class="input" required>
            <option v-for="entity in filteredEntities" :key="entity.entity_id" :value="entity.entity_id">
              {{ entityLabel(entity) }}
            </option>
          </select>
        </label>
        <label class="space-y-2 text-sm text-white/70">
          <span>Gewicht-Sensor</span>
          <select v-model="mapping.weightEntityId" class="input">
            <option value="">-</option>
            <option v-for="entity in filteredEntities" :key="entity.entity_id" :value="entity.entity_id">
              {{ entityLabel(entity) }}
            </option>
          </select>
        </label>
        <label class="space-y-2 text-sm text-white/70">
          <span>Distanz-Sensor</span>
          <select v-model="mapping.distanceEntityId" class="input">
            <option value="">-</option>
            <option v-for="entity in filteredEntities" :key="entity.entity_id" :value="entity.entity_id">
              {{ entityLabel(entity) }}
            </option>
          </select>
        </label>
        <label class="space-y-2 text-sm text-white/70">
          <span>Aktive-Minuten-Sensor</span>
          <select v-model="mapping.activeMinutesEntityId" class="input">
            <option value="">-</option>
            <option v-for="entity in filteredEntities" :key="entity.entity_id" :value="entity.entity_id">
              {{ entityLabel(entity) }}
            </option>
          </select>
        </label>
        <label class="space-y-2 text-sm text-white/70">
          <span>Kalorien-Sensor</span>
          <select v-model="mapping.caloriesEntityId" class="input">
            <option value="">-</option>
            <option v-for="entity in filteredEntities" :key="entity.entity_id" :value="entity.entity_id">
              {{ entityLabel(entity) }}
            </option>
          </select>
        </label>
        <button type="submit" class="md:col-span-2 rounded-2xl bg-gradient-to-r from-aurora to-pulse px-4 py-3 text-midnight font-semibold">Speichern</button>
      </form>

      <div class="mt-8 flex flex-wrap gap-4">
        <label class="flex flex-col text-sm text-white/70">
          <span>Import ab Datum</span>
          <input type="date" v-model="importDate" class="input" />
        </label>
        <button class="pill" @click="handleImport">Historie importieren</button>
        <button class="pill" @click="handleSync(selectedConnection.id)">Sofort synchronisieren</button>
      </div>
      <p v-if="syncInfo" class="mt-4 text-sm text-white/60">Letzter Job: {{ syncInfo.status }} – {{ syncInfo.importedDays }} Tage</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue';
import { useConnectionsStore, type HaEntity } from '../stores/connections';
import { useAuthStore } from '../stores/auth';

const store = useConnectionsStore();
const authStore = useAuthStore();
const connectionForm = reactive({ name: '', baseUrl: '', accessToken: '' });

const mapping = reactive({
  stepsEntityId: '',
  weightEntityId: '',
  distanceEntityId: '',
  activeMinutesEntityId: '',
  caloriesEntityId: ''
});

const selectedConnectionId = ref<string | null>(null);
const entityOptions = ref<HaEntity[]>([]);
const entitySearch = ref('');
const importDate = ref<string>('');
const syncInfo = ref<any>(null);
const settingsLoading = ref(false);
const profileSaving = ref(false);
const profileMessage = ref('');
const passwordSaving = ref(false);
const passwordMessage = ref('');
const profileForm = reactive({ displayName: '' });
const passwordForm = reactive({ currentPassword: '', newPassword: '' });

const connections = computed(() => store.connections);
const selectedConnection = computed(() => connections.value.find((c) => c.id === selectedConnectionId.value) ?? null);

const createConnection = async () => {
  await store.createConnection(connectionForm);
  Object.assign(connectionForm, { name: '', baseUrl: '', accessToken: '' });
};

const selectConnection = async (id: string) => {
  selectedConnectionId.value = id;
};

watch(selectedConnectionId, async (id) => {
  if (!id) return;
  const conn = connections.value.find((c) => c.id === id);
  Object.assign(mapping, {
    stepsEntityId: conn?.mapping?.stepsEntityId ?? '',
    weightEntityId: conn?.mapping?.weightEntityId ?? '',
    distanceEntityId: conn?.mapping?.distanceEntityId ?? '',
    activeMinutesEntityId: conn?.mapping?.activeMinutesEntityId ?? '',
    caloriesEntityId: conn?.mapping?.caloriesEntityId ?? ''
  });
  entityOptions.value = await store.fetchEntities(id);
  entitySearch.value = '';
});

const saveMapping = async () => {
  if (!selectedConnectionId.value) return;
  await store.saveMapping(selectedConnectionId.value, mapping);
};

const handleTest = async (id: string) => {
  await store.testConnection(id);
};

const handleSync = async (id: string) => {
  await store.triggerSync(id);
  syncInfo.value = await store.fetchSyncStatus(id);
};

const handleImport = async () => {
  if (!selectedConnectionId.value || !importDate.value) return;
  await store.triggerImport(selectedConnectionId.value, new Date(importDate.value).toISOString());
  syncInfo.value = await store.fetchSyncStatus(selectedConnectionId.value);
};

store.fetchConnections();
onMounted(() => {
  authStore.fetchSettings();
});

const removeConnection = async (id: string) => {
  await store.deleteConnection(id);
};

const entityLabel = (entity: HaEntity) => {
  const friendly = (entity.attributes?.friendly_name as string) ?? '';
  if (friendly && friendly.toLowerCase() !== entity.entity_id.toLowerCase()) {
    return `${friendly} (${entity.entity_id})`;
  }
  return entity.entity_id;
};

const sortedEntities = computed(() =>
  [...entityOptions.value].sort((a, b) => a.entity_id.localeCompare(b.entity_id))
);

const filteredEntities = computed(() => {
  const term = entitySearch.value.trim().toLowerCase();
  if (!term) return sortedEntities.value;
  return sortedEntities.value.filter((entity) => {
    const label = entityLabel(entity).toLowerCase();
    return label.includes(term);
  });
});

const showOnLeaderboard = computed(() => authStore.settings?.showOnLeaderboard ?? true);

const toggleLeaderboardVisibility = async () => {
  settingsLoading.value = true;
  try {
    await authStore.updateSettings({ showOnLeaderboard: !showOnLeaderboard.value });
  } finally {
    settingsLoading.value = false;
  }
};

watch(
  () => authStore.user?.displayName,
  (value) => {
    profileForm.displayName = value ?? '';
  },
  { immediate: true }
);

const saveProfile = async () => {
  profileSaving.value = true;
  profileMessage.value = '';
  try {
    await authStore.updateProfile({ displayName: profileForm.displayName });
    profileMessage.value = 'Profil aktualisiert.';
  } catch (error: any) {
    profileMessage.value = error?.response?.data?.message ?? 'Profil konnte nicht aktualisiert werden.';
  } finally {
    profileSaving.value = false;
  }
};

const savePassword = async () => {
  passwordSaving.value = true;
  passwordMessage.value = '';
  try {
    await authStore.updatePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
    passwordMessage.value = 'Passwort aktualisiert.';
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
  } catch (error: any) {
    passwordMessage.value = error?.response?.data?.message ?? 'Passwort konnte nicht aktualisiert werden.';
  } finally {
    passwordSaving.value = false;
  }
};
</script>

<style scoped>
.input {
  @apply w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder-white/30 focus:border-aurora focus:outline-none;
}
.pill {
  @apply rounded-full border border-white/10 px-4 py-2 text-white/70 hover:text-white hover:border-aurora transition;
}
</style>
