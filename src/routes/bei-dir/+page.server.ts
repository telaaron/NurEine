import { getLocalMarkers } from '$lib/server/queries';

export const prerender = false;

export async function load() {
  // Nur verortete Stories: die Seite rankt clientseitig per Haversine nach
  // Entfernung — Stories ohne lat/lng könnten dabei nie auftauchen. Sie
  // trotzdem auszuliefern wäre reines Payload-Gewicht.
  const stories = await getLocalMarkers();
  return { stories };
}
