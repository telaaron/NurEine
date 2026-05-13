import { getAllSubscribers, getSubscriberStats } from '$lib/server/queries';

export async function load() {
  const [subscribers, stats] = await Promise.all([
    getAllSubscribers(),
    getSubscriberStats()
  ]);
  return { subscribers, stats };
}
