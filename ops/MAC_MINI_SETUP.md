# Mac Mini (Server, Mid 2011) → Ubuntu-Dauer-Runner für NurEine

Ziel: Der Mac Mini übernimmt 24/7 die nächtlichen NurEine-Routinen, damit Aarons
MacBook nicht mehr laufen muss. Betrieb über das **Claude-Max-Abo (kein API-Key)**.
Am Ende läuft der Mini **headless** (nur Strom + WLAN), gesteuert per **SSH** vom MacBook.

> **Diese Datei = der Teil, den DU am Mini machst.** Ab dem Punkt „SSH steht"
> übernimmt Claude Code per SSH (Pakete installieren, Repo klonen, Routinen einrichten).

Hardware bestätigt: Core i7 Quad 2,3 GHz, 16 GB DDR3. OS-Ziel: **Ubuntu 24.04 LTS Desktop**
(Desktop wegen einfachem WLAN-/Broadcom-Setup; du hast für die Einrichtung Bild/Tastatur/Maus
dran, danach wird alles abgebaut).

---

## Übersicht der Schritte (grob)

1. USB-Stick mit Ubuntu 24.04 beschreiben (am **MacBook**)
2. Mini vom Stick booten (Boot-Menü mit `alt`/`⌥`)
3. Ubuntu installieren (interne Platte wird gelöscht — SSD 500G ist NICHT angeschlossen)
4. WLAN verbinden (Broadcom-Treiber)
5. SSH aktivieren + **IP-Adresse + Benutzername notieren**  ← wichtig vor dem Abbauen!
6. SSH-Key vom MacBook hinterlegen (passwortloser Login)
7. Melde dich bei Claude → ab hier übernimmt Claude per SSH

---

## Schritt 1 — USB-Stick beschreiben (am MacBook)

> Wird von Claude begleitet. Der Stick `UBUNTU 22_0` (disk4) wird komplett überschrieben.
> **Sicherheitscheck:** Vor `dd` prüfen, dass die Disk-Nummer wirklich der Stick ist
> (15,8 GB, „external"), NICHT die 500-GB-SSD.

Ablauf (Claude führt die exakten Befehle aus):
- ISO ist geladen + SHA256 verifiziert (`~/Downloads/ubuntu-24.04.4-desktop-amd64.iso`)
- Stick aushängen: `diskutil unmountDisk /dev/disk4`
- Beschreiben: `sudo dd if=<iso> of=/dev/rdisk4 bs=4m` (rdisk = schneller)
- Danach fragt macOS „Medium nicht lesbar" → **Ignorieren** klicken (Linux-Format, normal)
- Auswerfen: `diskutil eject /dev/disk4`

---

## Schritt 2 — Mini vom Stick booten

1. Mini **ausschalten**. Sicherstellen: **SSD 500G ist NICHT am Mini** (nur der USB-Stick +
   ggf. interne Platte). USB-Stick direkt am Mini (nicht über Hub).
2. Mini einschalten und **sofort `⌥` (alt/option) gedrückt halten**, bis das Boot-Menü kommt.
3. Den Eintrag **„EFI Boot"** (oranges/gelbes Stick-Symbol) wählen → Enter.
4. Im Ubuntu-GRUB: **„Try or Install Ubuntu"** wählen.

> Bootet der Stick nicht (kein EFI-Boot-Eintrag)? → siehe **Troubleshooting** unten.

---

## Schritt 3 — Ubuntu installieren

1. Sprache wählen → **„Ubuntu installieren"**.
2. Tastatur: **German** (falls deutsche Tastatur).
3. **„Normale Installation"**. Haken bei „Drittanbieter-Software / Treiber installieren"
   **setzen** (bringt WLAN-/Grafik-Treiber mit — wichtig für Broadcom!).
4. Installationsart: **„Festplatte löschen und Ubuntu installieren"**.
   - ⚠️ Es darf hier **nur die interne Mini-Platte** zur Auswahl stehen. Wenn du mehr als
     eine Platte siehst → **STOP**, melde dich bei Claude. Die SSD 500G darf nicht dabei sein.
5. Zeitzone: **Berlin**. Benutzer anlegen:
   - Name: `aaron` (oder frei) · Rechnername: **`mac-mini-server`** (merken!)
   - Passwort setzen (merken — brauchst du gleich für sudo).
   - **„Automatisch anmelden"** ist ok (Rechner steht sicher zu Hause).
6. Installation durchlaufen lassen → **Neustart**, Stick abziehen wenn dazu aufgefordert.

---

## Schritt 4 — WLAN verbinden

Nach dem ersten Start (Desktop):
1. Oben rechts aufs Netzwerk-Symbol → dein WLAN wählen → Passwort → verbinden.
2. **Kein WLAN sichtbar?** (Broadcom-Chip braucht Treiber):
   - Falls du den Mini **kurz per LAN-Kabel** anstöpseln kannst: tu das temporär, dann:
     `sudo apt update && sudo apt install -y bcmwl-kernel-source` → Neustart → WLAN da.
   - Kein LAN möglich? → **Troubleshooting → WLAN/Broadcom** unten (Offline-Treiber).

Teste: Browser auf, irgendeine Seite lädt. WLAN muss stehen, bevor du weitermachst.

---

## Schritt 5 — SSH aktivieren + Zugangsdaten notieren ⭐ WICHTIG

Damit du nach dem Abbauen von Tastatur/Bild noch reinkommst. **Terminal** öffnen
(`Strg+Alt+T`) und eingeben:

```bash
# 1. SSH-Server installieren + starten
sudo apt update
sudo apt install -y openssh-server
sudo systemctl enable --now ssh

# 2. IP-Adresse des Mini im WLAN anzeigen — DIESE NOTIEREN:
hostname -I
#   → z.B. 192.168.178.42   (die erste Zahl ist die relevante)

# 3. Benutzernamen anzeigen — NOTIEREN:
whoami
#   → z.B. aaron

# 4. Sicherstellen dass der Mini nicht schläft (24/7-Betrieb):
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

**Notiere dir und gib Claude durch:**
- IP-Adresse (aus `hostname -I`): `__________`
- Benutzername (aus `whoami`): `__________`
- Rechnername: `mac-mini-server`

> Tipp: Am Router eine **feste IP / DHCP-Reservierung** für `mac-mini-server` setzen, damit
> die IP sich nicht ändert. (Kann Claude dir später erklären.)

---

## Schritt 6 — SSH-Key vom MacBook (passwortloser Login)

Auf dem **MacBook** (macht Claude mit dir):
```bash
# Key vom MacBook auf den Mini kopieren (IP + user einsetzen):
ssh-copy-id aaron@192.168.178.42
# einmal das Mini-Passwort eingeben → danach Login ohne Passwort
```
Test: `ssh aaron@192.168.178.42` → du bist auf dem Mini, ohne Passwort. **Fertig.**

---

## Schritt 7 — An Claude übergeben

Sobald `ssh aaron@<IP>` vom MacBook klappt:
→ **Sag Claude: „SSH steht, IP ist <…>, user ist <…>".**

Ab hier übernimmt Claude per SSH:
- System-Pakete, Node 22, Python, ffmpeg, Chromium-Libs, Fonts
- Claude Code installieren + Abo-Token hinterlegen (kein API-Key)
- NurEine-Repo klonen, `.env` + `.mcp.json`, Remotion/TTS-Toolchain
- Alle Routinen als gestaffelte cron-Jobs einrichten
- GitHub-Actions-Crons deaktivieren (kein Doppel-Posting)

**Dann kannst du Tastatur, Maus und Monitor abbauen** — der Mini läuft headless weiter.

---

## Troubleshooting

### Stick bootet nicht / kein „EFI Boot" im ⌥-Menü
- Stick an einem **hinteren USB-2-Port** direkt am Mini (kein Hub, kein USB-3-Adapter).
- Nochmal neu beschrieben? macOS' „Medium nicht lesbar" beim Beschreiben ist normal.
- Alternativ Stick neu mit **balenaEtcher** (GUI) beschreiben — manchmal boot-freundlicher.

### WLAN/Broadcom offline lösen (kein LAN verfügbar)
Der 2011er nutzt meist einen **Broadcom BCM4331**. Ohne Internet:
1. Auf dem MacBook das Paket `bcmwl-kernel-source` + Abhängigkeiten als `.deb` vorab von
   packages.ubuntu.com (noble) laden, auf einen zweiten USB-Stick, am Mini
   `sudo dpkg -i *.deb` → Neustart. (Claude kann dir die genaue Paketliste geben.)
2. Oder günstiger **USB-WLAN-Stick** mit Linux-Standardchip (z.B. RTL8188) — Plug-and-Play,
   umgeht Broadcom komplett. Für einmalige Einrichtung reicht das.

### Mini geht nachts in Standby / SSH weg
- Schritt-5-`mask`-Befehl ausgeführt? Zusätzlich in „Einstellungen → Energie" alles auf
  „Nie". Claude prüft das per SSH nach.

### IP hat sich geändert (komme nicht mehr per SSH rein)
- Am Router in der Geräteliste nach `mac-mini-server` suchen → neue IP.
- Oder Monitor kurz wieder dran, `hostname -I`.
- Vorbeugung: DHCP-Reservierung am Router (feste IP).
