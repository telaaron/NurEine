import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * /lokal war inhaltlich ein Doppelgänger von /bei-dir: gleiche Überschrift,
 * gleiche Story-Karten, nur ohne Geo-Bezug. Das Einreichen-Formular dort war
 * eine Attrappe (preventDefault, kein Backend) — das echte liegt auf
 * /einreichen. Dauerhaft zusammengelegt, damit nicht zwei Seiten um dieselben
 * Suchbegriffe konkurrieren.
 */
export const GET: RequestHandler = () => {
  redirect(301, '/bei-dir');
};
