import { getAllB2BClients } from '$lib/server/queries';

export async function load() {
  const clients = await getAllB2BClients();
  return { clients };
}
