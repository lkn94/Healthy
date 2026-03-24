<template>
  <section class="space-y-10">
    <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 class="text-2xl font-display">Verbindungen</h2>
      <p class="text-white/60">Kopple Home Assistant Instanzen und verschlüssele Tokens serverseitig.</p>
      <form class="mt-6 grid gap-4 md:grid-cols-3" @submit.prevent="createConnection">
        <input v-model="connectionForm.name" class="input" placeholder="Name" required />
        <input v-model="connectionForm.baseUrl" class="input" placeholder="Base URL" required />
        <input v-model="connectionForm.accessToken" class="input" placeholder="Long-Lived Token" required />
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
            <button class="pill" @click="selectConnection(connection.id)">Mapping</button>
            <button class="pill" @click="handleTest(connection.id)">Testen</button>
            <button class="pill" @click="handleSync(connection.id)">Sync</button>
            <button class="pill" @click="removeConnection(connection.id)">Löschen</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedConnection" class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 class="text-2xl font-display">Sensor Mapping – {{ selectedConnection.name }}</h2>
      <p class="text-white/60">Wähle passende Entities für Schritte, Gewicht, Distanz und Active Minutes.</p>
      <form class="mt-6 grid gap-4 md:grid-cols-2" @submit.prevent="saveMapping">
        <label class="md:col-span-2 space-y-2 text-sm text-white/70">
          <span>Sensoren filtern</span>
          <input v-model="entitySearch" class="input" placeholder="sensor.schritte oder Name" />
        </label>
        <label class="space-y-2 text-sm text-white/70">
          <span>Steps Entity</span>
          <select v-model="mapping.stepsEntityId" class="input" required>
            <option v-for="entity in filteredEntities" :key="entity.entity_id" :value="entity.entity_id">
              {{ entityLabel(entity) }}
            </option>
          </select>
        </label>
        <label class="space-y-2 text-sm text-white/70">
          <span>Weight Entity</span>
          <select v-model="mapping.weightEntityId" class="input">
            <option value="">-</option>
            <option v-for="entity in filteredEntities" :key="entity.entity_id" :value="entity.entity_id">
              {{ entityLabel(entity) }}
            </option>
          </select>
        </label>
        <label class="space-y-2 text-sm text-white/70">
          <span>Distance Entity</span>
          <select v-model="mapping.distanceEntityId" class="input">
            <option value="">-</option>
            <option v-for="entity in filteredEntities" :key="entity.entity_id" :value="entity.entity_id">
              {{ entityLabel(entity) }}
            </option>
          </select>
        </label>
        <label class="space-y-2 text-sm text-white/70">
          <span>Active Minutes Entity</span>
          <select v-model="mapping.activeMinutesEntityId" class="input">
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
        <button class="pill" @click="handleImport">History Import</button>
        <button class="pill" @click="handleSync(selectedConnection.id)">Sofort Sync</button>
      </div>
      <p v-if="syncInfo" class="mt-4 text-sm text-white/60">Letzter Job: {{ syncInfo.status }} – {{ syncInfo.importedDays }} Tage</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useConnectionsStore, type HaEntity } from '../stores/connections';

const store = useConnectionsStore();
const connectionForm = reactive({ name: '', baseUrl: '', accessToken: '' });

const mapping = reactive({
  stepsEntityId: '',
  weightEntityId: '',
  distanceEntityId: '',
  activeMinutesEntityId: ''
});

const selectedConnectionId = ref<string | null>(null);
const entityOptions = ref<HaEntity[]>([]);
const entitySearch = ref('');
const importDate = ref<string>('');
const syncInfo = ref<any>(null);

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
    activeMinutesEntityId: conn?.mapping?.activeMinutesEntityId ?? ''
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
</script>

<style scoped>
.input {
  @apply w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder-white/30 focus:border-aurora focus:outline-none;
}
.pill {
  @apply rounded-full border border-white/10 px-4 py-2 text-white/70 hover:text-white hover:border-aurora transition;
}
</style>
