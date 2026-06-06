const dayFormatterCache = new Map<string, Intl.DateTimeFormat>();
const dateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();

const getDayFormatter = (timeZone: string) => {
  let formatter = dayFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    dayFormatterCache.set(timeZone, formatter);
  }
  return formatter;
};

const getDateTimeFormatter = (timeZone: string) => {
  let formatter = dateTimeFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      hourCycle: 'h23',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    dateTimeFormatterCache.set(timeZone, formatter);
  }
  return formatter;
};

const formatDayLabel = (year: string, month: string, day: string) => `${year}-${month}-${day}`;

const parseDayLabel = (label: string) => {
  const [year, month, day] = label.split('-').map(Number);
  return { year, month, day };
};

const getParts = (formatter: Intl.DateTimeFormat, date: Date) => {
  const values = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  // Some ICU builds (e.g. in Alpine/Node containers) format midnight as "24"
  // under hourCycle 'h23' instead of "00". Feeding hour 24 into Date.UTC below
  // overshoots by a full day and shifts every computed day boundary 24h earlier
  // — which made "today" resolve to yesterday's window in production while local
  // (full-ICU) machines were fine. Normalize it.
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour === '24' ? '00' : values.hour,
    minute: values.minute,
    second: values.second
  };
};

const getTimeZoneOffsetMilliseconds = (date: Date, timeZone: string) => {
  const parts = getParts(getDateTimeFormatter(timeZone), date);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - date.getTime();
};

const zonedTimeToUtc = (
  year: number,
  month: number,
  day: number,
  timeZone: string,
  hour = 0,
  minute = 0,
  second = 0
) => {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const initialOffset = getTimeZoneOffsetMilliseconds(new Date(utcGuess), timeZone);
  let result = utcGuess - initialOffset;
  const adjustedOffset = getTimeZoneOffsetMilliseconds(new Date(result), timeZone);
  if (adjustedOffset !== initialOffset) {
    result = utcGuess - adjustedOffset;
  }
  return new Date(result);
};

export const getZonedDayLabel = (date: Date | string, timeZone: string) => {
  const parts = getParts(getDayFormatter(timeZone), new Date(date));
  return formatDayLabel(parts.year, parts.month, parts.day);
};

export const getDayLabelsInRange = (from: Date, to: Date, timeZone: string) => {
  return getDayLabelsBetween(getZonedDayLabel(from, timeZone), getZonedDayLabel(to, timeZone));
};

export const getDayLabelsBetween = (fromLabel: string, toLabel: string) => {
  const labels: string[] = [];
  let cursor = dayLabelToUtcDate(fromLabel);
  const end = dayLabelToUtcDate(toLabel);

  while (cursor.getTime() <= end.getTime()) {
    labels.push(cursor.toISOString().split('T')[0]);
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  return labels;
};

export const dayLabelToUtcDate = (label: string) => new Date(`${label}T00:00:00.000Z`);

export const getZonedDayBounds = (label: string, timeZone: string) => {
  const { year, month, day } = parseDayLabel(label);
  const start = zonedTimeToUtc(year, month, day, timeZone);

  const nextDay = new Date(dayLabelToUtcDate(label).getTime() + 24 * 60 * 60 * 1000);
  const nextLabel = nextDay.toISOString().split('T')[0];
  const nextParts = parseDayLabel(nextLabel);
  const end = zonedTimeToUtc(nextParts.year, nextParts.month, nextParts.day, timeZone);

  return { start, end };
};
