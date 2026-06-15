import type { MarketEvent } from '@/lib/services/event.service';
import { isSameDay, parseISO } from 'date-fns';

export type EventImpact = 'HIGH' | 'MEDIUM' | 'LOW';
export type MarketBehavior = 'LOW_MOMENTUM' | 'CAUTIOUS' | 'NORMAL';

export interface EventEngineResult {
  event: string | null;
  eventDate: string | null;
  impact: EventImpact;
  marketBehavior: MarketBehavior;
  allEvents: MarketEvent[];
}

export function runEventEngine(events: MarketEvent[]): EventEngineResult {
  const today = new Date();

  const todayEvent = events.find((e) => isSameDay(parseISO(e.date), today));
  if (todayEvent) {
    return {
      event: todayEvent.name,
      eventDate: todayEvent.date,
      impact: todayEvent.impact as EventImpact,
      marketBehavior: todayEvent.impact === 'HIGH' ? 'LOW_MOMENTUM' : 'CAUTIOUS',
      allEvents: events,
    };
  }

  const tomorrowEvent = events.find((e) => {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return isSameDay(parseISO(e.date), tomorrow);
  });

  if (tomorrowEvent) {
    return {
      event: tomorrowEvent.name,
      eventDate: tomorrowEvent.date,
      impact: 'MEDIUM',
      marketBehavior: 'CAUTIOUS',
      allEvents: events,
    };
  }

  return {
    event: null,
    eventDate: null,
    impact: 'LOW',
    marketBehavior: 'NORMAL',
    allEvents: events,
  };
}
