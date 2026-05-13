import { getDeliveryLog } from '$lib/server/queries';

export async function load() {
  const log = await getDeliveryLog(100);
  return { log };
}
