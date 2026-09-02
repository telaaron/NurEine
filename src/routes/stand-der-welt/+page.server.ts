import data from '$lib/data/langzeitindex.json';

export const prerender = true;

/**
 * Der Langzeitindex kommt aus einer statischen JSON im Repo, NICHT aus Supabase.
 *
 * Zwei Gruende (VISION.md D-09):
 *  1. Der Index aendert sich woechentlich, nicht sekuendlich — ein Livecall
 *     pro Aufruf waere reine Verschwendung.
 *  2. Die Seite muss einen Supabase-402 ueberstehen. Die alte Fassung las
 *     `nureine_world_metrics` live und war bei jedem Ausfall leer.
 *
 * Erzeugt von `scripts/index_build.py` nach der praeregistrierten Spezifikation
 * (docs/langzeitindex-spec.json). Nie von Hand editieren.
 */
export function load() {
	return { index: data };
}
