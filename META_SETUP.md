# META_SETUP.md — Instagram-Auto-Posting scharfschalten

Ziel: NurEine postet täglich automatisch auf Instagram (hinter Approval-Gate).
Dafür braucht der Code zwei Werte: `IG_USER_ID` + `IG_ACCESS_TOKEN`.
Die holen wir am Ende. Davor müssen Accounts stehen.

**Aufwand:** ~30–45 Min. Meist Account-Bürokratie, kein Technik-Problem.
**Was Claude NICHT machen darf:** einloggen, Passwörter eingeben, Accounts erstellen,
OAuth-„Zulassen" klicken. Das machst du. Claude macht: App-Navigation zeigen,
Token-Tausch (curl), Vercel-env setzen.

---

## Schritt 1 — Instagram-Account (IG-App, Handy)

1. Neuen Account anlegen. Handle: `nureine.de` (oder `nureine_de`, falls vergeben).
2. **Profilbild:** NurEine-Logo, dunkel auf hellem Grund. Kein Gesicht.
3. **Bio:** `Eine Geschichte. Täglich. Belegt. Werbefrei.`
4. **Website:** `https://nureine.de`
5. **Auf Business umstellen** (WICHTIG — Creator reicht für Posting auch, aber Business ist sauberer):
   Einstellungen → Konto → **Kontotyp wechseln** → **Business** → Kategorie „Nachrichten/Medien".

✅ Fertig wenn: Profil ist Business, Bio + Link gesetzt.

---

## Schritt 2 — Facebook-Konto + Seite (Rechner, Browser)

Die IG Graph API funktioniert NUR über eine verknüpfte Facebook-Seite. Pflicht.

1. **FB-Konto:** facebook.com → registrieren. Echter Name (Meta will Klarnamen für Developer-Zugang).
   Ggf. Handynummer-Verify — normal bei neuen Konten.
2. **FB-Seite erstellen:** facebook.com/pages/create → Name „NurEine" → Kategorie „Nachrichten- und Medienwebsite".
   Kein Inhalt nötig, die Seite muss nur existieren.

✅ Fertig wenn: FB-Konto aktiv + Seite „NurEine" existiert.

---

## Schritt 3 — Instagram ↔ Facebook-Seite verknüpfen (IG-App)

1. IG-App → Einstellungen → **Account Center** (oder „Verknüpfte Konten").
2. Facebook-Seite „NurEine" hinzufügen/verbinden.

✅ Fertig wenn: in der IG-App steht die FB-Seite als verbunden.

---

## Schritt 4 — Meta-Developer-App (Browser — HIER hilft Claude)

Sag Claude Bescheid, sobald Schritt 1–3 stehen. Dann gemeinsam:

1. developers.facebook.com → „My Apps" → **Create App**.
2. Use case: **Other** → Typ **Business** → Name „NurEine Poster".
3. App-Dashboard → **Add Product** → **Instagram** (Graph API) hinzufügen.
4. Im Graph API Explorer (oder über die App-Permissions) ein **User-Token** mit diesen Scopes erzeugen:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
   - `business_management`
5. Token in den Explorer generieren → **Kurzzeit-Token kopieren**, an Claude geben.

⚠️ **App Review:** Für den EIGENEN Account (du bist App-Admin/Tester) im **Development-Mode**
brauchst du KEIN Review. Posten geht sofort. Review nur nötig, um an fremden Accounts zu posten.

---

## Schritt 5 — Token-Tausch + IG-ID (Claude macht das)

Mit dem Kurzzeit-Token holt Claude:

```bash
# Long-Lived Token (60 Tage) tauschen
curl -s "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_TOKEN"

# FB-Seiten + verknüpfte IG-Business-Account-ID auslesen
curl -s "https://graph.facebook.com/v21.0/me/accounts?fields=instagram_business_account,name&access_token=LONG_TOKEN"
```

Ergebnis: `IG_USER_ID` (die instagram_business_account.id) + `IG_ACCESS_TOKEN` (Long-Lived).

---

## Schritt 6 — Vercel-Env setzen (Claude oder du)

In Vercel (alle 3 Envs: production, preview, development):
```
IG_USER_ID=<die ID aus Schritt 5>
IG_ACCESS_TOKEN=<Long-Lived-Token>
```
Optional: `SOCIAL_AUTOPILOT=false` (Default — Approval-Gate. Auf `true` = Voll-Auto.)

Nach dem Redeploy postet `/api/cron/social-publish` (05:30 UTC) freigegebene Posts automatisch.

---

## Schritt 7 — Smoke-Test

1. `/admin/social` → einen Entwurf **freigeben** (status approved).
2. `scheduled_for` auf „jetzt" setzen (oder warten bis 05:30 UTC).
3. Manuell triggern:
   ```bash
   curl -X POST https://nureine.de/api/cron/social-publish -H "Authorization: Bearer $CRON_SECRET"
   ```
4. Antwort `{posted: 1}` → Post ist live auf Instagram. 🎉

---

## Token-Haltbarkeit (wichtig!)

Long-Lived-Token = **60 Tage**, dann abgelaufen → Posts schlagen fehl (status failed im Admin).
Bevor das produktiv wird: Token-Refresh-Cron bauen (verlängert automatisch alle ~50 Tage).
Claude baut das, sobald der erste Token steht. Bis dahin: Kalendererinnerung Tag 55.
