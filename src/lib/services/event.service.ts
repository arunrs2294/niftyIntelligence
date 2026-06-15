import { readFileSync } from 'fs';
import { resolve } from 'path';
import { addDays, isAfter, isBefore, parseISO, startOfDay } from 'date-fns';

export interface MarketEvent {
  name: string;
  date: string; // YYYY-MM-DD
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

function loadEvents(): MarketEvent[] {
  const filePath = resolve(process.cwd(), 'data', 'events.json');
  return JSON.parse(readFileSync(filePath, 'utf-8')) as MarketEvent[];
}

export function getUpcomingEvents(daysAhead: number = 2): MarketEvent[] {
  const events = loadEvents();
  const today = startOfDay(new Date());
  const limit = addDays(today, daysAhead);

  return events.filter((e) => {
    const eventDate = parseISO(e.date);
    return !isBefore(eventDate, today) && !isAfter(eventDate, limit);
  });
}
