"""
Select Daily Hero Story
=======================
Sets the story with the highest impact_score from the last 24 hours
as today's hero story. All other stories get is_hero=false.

Stories that have already been sent as newsletter hero in the last 48h
are excluded to prevent duplicate sends.

Fallback: If no unsent stories in the last 24h, widens to 48h.
If still nothing found, exits gracefully without selecting a hero.
"""

import os
import sys
import requests
from datetime import datetime, timezone, timedelta

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
    sys.exit(1)

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}


def supabase_get(path: str, params: dict = None) -> requests.Response:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    return requests.get(url, headers=HEADERS, params=params)


def supabase_patch(path: str, data: dict, params: dict = None) -> requests.Response:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {**HEADERS, 'Prefer': 'return=minimal'}
    return requests.patch(url, headers=headers, json=data, params=params)


def _filter_unsent(stories: list[dict], hours: int = 48) -> list[dict]:
    """Remove stories that have already been sent as newsletter hero."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    unsent = []
    for s in stories:
        sent_at = s.get('newsletter_sent_at')
        if not sent_at:
            unsent.append(s)
            continue
        try:
            # Handle both datetime and string formats from PostgREST
            if isinstance(sent_at, str):
                sent_dt = datetime.fromisoformat(sent_at.replace('Z', '+00:00'))
            else:
                sent_dt = sent_at
            if sent_dt < cutoff:
                unsent.append(s)
        except (ValueError, TypeError):
            # If we can't parse the timestamp, include the story (safer to include than exclude)
            unsent.append(s)
    return unsent


def main():
    print("[hero] Starting daily hero selection...")

    # 1. Set all stories that are currently hero to is_hero = false
    print("[hero] Resetting hero flags for current heroes...")
    resp = supabase_patch('nureine_stories', {'is_hero': False}, {'is_hero': 'eq.true'})
    if resp.status_code not in (200, 204):
        print(f"[hero] Failed to reset heroes: {resp.status_code} {resp.text}")
        # Non-fatal: there may simply be no hero stories yet

    # 2. Fetch candidate stories — first try 24h, then 48h fallback
    #    Fetch top 10 by impact_score so we can filter out already-sent ones.
    cutoff_48h = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat()
    resp = supabase_get('nureine_stories', {
        'published_at': f'gte.{cutoff_48h}',
        'order': 'impact_score.desc',
        'limit': '10',
        'select': 'id,title,impact_score,published_at,newsletter_sent_at'
    })

    if resp.status_code != 200:
        print(f"[hero] Failed to fetch stories: {resp.status_code} {resp.text}")
        sys.exit(1)

    all_candidates = resp.json()
    if not all_candidates:
        print("[hero] No stories found in last 48h")
        log = {
            'type': 'select_hero',
            'stories_found': 0,
            'stories_inserted': 0,
            'error': 'No stories in last 48h'
        }
        requests.post(
            f"{SUPABASE_URL}/rest/v1/nureine_cron_runs",
            headers=HEADERS,
            json=log
        )
        return

    # 3. Prefer stories from last 24h, widen to 48h if none eligible
    cutoff_24h = datetime.now(timezone.utc) - timedelta(hours=24)

    def _in_last_24h(s: dict) -> bool:
        pub = s.get('published_at')
        if not pub:
            return False
        if isinstance(pub, str):
            pub = datetime.fromisoformat(pub.replace('Z', '+00:00'))
        return pub >= cutoff_24h

    candidates_24h = [s for s in all_candidates if _in_last_24h(s)]
    candidates_48h = all_candidates  # already fetched

    print(f"[hero] Found {len(candidates_24h)} stories in last 24h, {len(candidates_48h)} in last 48h")

    # 4. Filter out already-sent stories (deduplication)
    unsent = _filter_unsent(candidates_24h, hours=48)
    if not unsent:
        print("[hero] All 24h stories already sent, widening to 48h pool")
        unsent = _filter_unsent(candidates_48h, hours=48)

    if not unsent:
        print("[hero] No unsent stories found (all candidates were already sent in last 48h)")
        log = {
            'type': 'select_hero',
            'stories_found': len(all_candidates),
            'stories_inserted': 0,
            'error': 'All available stories already sent in last 48h'
        }
        requests.post(
            f"{SUPABASE_URL}/rest/v1/nureine_cron_runs",
            headers=HEADERS,
            json=log
        )
        return

    hero = unsent[0]
    hero_id = hero['id']
    print(f"[hero] Selected: {hero.get('title', hero_id)} (score: {hero.get('impact_score', '?')})")

    # 5. Set the best story as hero
    resp = supabase_patch(f"nureine_stories?id=eq.{hero_id}", {'is_hero': True})
    if resp.status_code in (200, 204):
        print(f"[hero] Hero set: {hero.get('title', hero_id)} (score: {hero.get('impact_score', '?')})")
    else:
        print(f"[hero] Failed to set hero: {resp.status_code} {resp.text}")
        sys.exit(1)

    # 6. Log to cron_runs
    log = {
        'type': 'select_hero',
        'stories_found': len(all_candidates),
        'stories_inserted': 1,
        'error': None
    }
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/nureine_cron_runs",
        headers=HEADERS,
        json=log
    )
    print(f"[hero] Cron log: {resp.status_code}")


if __name__ == '__main__':
    main()
