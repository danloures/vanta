import { fetchEventsFromSupabase } from './eventsApi';
import { Event } from '../types';

export async function getEventById(id: string): Promise<Event | null> {
  try {
    const events = await fetchEventsFromSupabase();
    return events.find(e => e.id === id) || null;
  } catch { return null; }
}