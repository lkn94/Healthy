/**
 * Read-only diagnostic: confirms how Home Assistant stamps the synthetic
 * "state as of window start" sample for a per-day history query — the exact
 * fetch shape syncRunner uses. Run it to verify the daily-step day-boundary fix
 * against a real instance.
 *
 *   HA_BASE_URL=... HA_TOKEN=... HA_STEPS_ENTITY=sensor.xxx \
 *     npx ts-node src/diagnostics/haBoundaryCheck.ts
 *
 * Nothing is written; only GET requests are made. No credentials are persisted.
 */
import { HomeAssistantClient } from '../services/homeAssistant';
import { getZonedDayBounds, getZonedDayLabel, getDayLabelsBetween } from '../services/timezone';

const required = (name: string) => {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
};

const fmt = (iso: string) => {
  const ms = new Date(iso).getTime();
  return `${iso}  (epoch ${ms})`;
};

const main = async () => {
  const baseUrl = required('HA_BASE_URL');
  const token = required('HA_TOKEN');
  const stepsEntity = required('HA_STEPS_ENTITY');

  const client = new HomeAssistantClient(baseUrl, token);
  const timeZone = await client.fetchTimeZone();
  const now = new Date();
  const todayLabel = getZonedDayLabel(now, timeZone);

  // yesterday + today, exactly like a midnight sync range
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dayLabels = getDayLabelsBetween(getZonedDayLabel(start, timeZone), todayLabel);

  console.log('========================================================');
  console.log(`HA time zone: ${timeZone}`);
  console.log(`today (zoned): ${todayLabel}`);
  console.log(`entity: ${stepsEntity}`);
  console.log('========================================================\n');

  for (const dayLabel of dayLabels) {
    const { start: dayStartDate, end: dayEndDate } = getZonedDayBounds(dayLabel, timeZone);
    const dayStart = dayStartDate.getTime();

    const history = await client.fetchHistory({
      from: dayStartDate,
      to: dayEndDate,
      entityIds: [stepsEntity]
    });

    const series = history.find((s) => s.length && s[0].entity_id === stepsEntity) ?? [];

    console.log(`--- day ${dayLabel} ---`);
    console.log(`  query from : ${fmt(dayStartDate.toISOString())}  <-- dayStart`);
    console.log(`  query to   : ${fmt(dayEndDate.toISOString())}`);
    console.log(`  entries in series: ${series.length}`);

    series.slice(0, 4).forEach((entry, index) => {
      const ts = new Date(entry.last_changed).getTime();
      const rel = ts < dayStart ? 'BEFORE dayStart' : ts === dayStart ? '=== dayStart' : 'AFTER dayStart';
      console.log(`  [${index}] state=${entry.state}`);
      console.log(`       last_changed: ${fmt(entry.last_changed)}`);
      console.log(`       last_updated: ${fmt(entry.last_updated)}`);
      console.log(`       last_changed vs dayStart: ${rel} (delta ${ts - dayStart} ms)`);
    });
    if (series.length > 4) {
      const last = series[series.length - 1];
      console.log(`  ... last entry: state=${last.state} last_changed=${last.last_changed}`);
    }
    console.log('');
  }

  // Live state — relevant for the overlay (last_changed vs last_updated).
  const live = await client.fetchEntityState(stepsEntity);
  console.log('--- live state (fetchEntityState) ---');
  if (!live) {
    console.log('  <no live state>');
  } else {
    console.log(`  state        : ${live.state}`);
    console.log(`  last_changed : ${fmt(live.last_changed)}  -> zoned day ${getZonedDayLabel(live.last_changed, timeZone)}`);
    console.log(`  last_updated : ${fmt(live.last_updated)}  -> zoned day ${getZonedDayLabel(live.last_updated, timeZone)}`);
    const diverge = getZonedDayLabel(live.last_changed, timeZone) !== getZonedDayLabel(live.last_updated, timeZone);
    console.log(`  changed/updated land on different zoned days: ${diverge ? 'YES (overlay fix matters here)' : 'no'}`);
  }
  console.log('\n========================================================');
};

main().catch((err) => {
  console.error('Diagnostic failed:', err?.message ?? err);
  process.exit(1);
});
