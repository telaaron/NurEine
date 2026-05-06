"""
Select Daily Hero Story
=======================
Sets the story with the highest impact_score from the last 24 hours
as today's hero story. All other stories get is_hero=false.
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


def supabase_patch(path: str, data: dict) -> requests.Response:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {**HEADERS, 'Prefer': 'return=minimal'}
    return requests.patch(url, headers=headers, json=data)


def main():
    print("[hero] Starting daily hero selection...")

    # 1. Set all stories is_hero = false
    print("[hero] Resetting all hero flags...")
    resp = supabase_patch('nureine_stories', {'is_hero': False})
    if resp.status_code not in (200, 204):
        print(f"[hero] Failed to reset heroes: {resp.status_code} {resp.text}")
        sys.exit(1)

    # 2. Get the highest-impact story from the last 24 hours
    yesterday = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    resp = supabase_get('nureine_stories', {
        'published_at': f'gte.{yesterday}',
        'order': 'impact_score.desc',
        'limit': '1',
        'select': 'id,title,impact_score,published_at'
    })

    if resp.status_code != 200 or not resp.json():
        # Fallback: get highest-impact story overall
        print("[hero] No stories from last 24h, using highest impact overall")
        resp = supabase_get('nureine_stories', {
            'order': 'impact_score.desc',
            'limit': '1',
            'select': 'id,title,impact_score,published_at'
        })

    stories = resp.json()
    if not stories:
        print("[hero] No stories found at all")
        return

    hero = stories[0]
    hero_id = hero['id']

    # 3. Set the best story as hero
    resp = supabase_patch(f"nureine_stories?id=eq.{hero_id}", {'is_hero': True})
    if resp.status_code in (200, 204):
        print(f"[hero] Hero set: {hero.get('title', hero_id)} (score: {hero.get('impact_score', '?')})")
    else:
        print(f"[hero] Failed to set hero: {resp.status_code} {resp.text}")
        sys.exit(1)

    # 4. Log to cron_runs
    log = {
        'type': 'select_hero',
        'stories_found': 1,
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
