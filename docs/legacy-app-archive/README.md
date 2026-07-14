# Legacy App-Archiv (vor Phase-3-Neuerfindung)

`routes-app/` ist die alte `src/routes/app/`-SPA (Capacitor-iOS-Shell, client-only,
Stand vor der App-Neuerfindung 2026-07). **Nur Referenz** — bewusst aus `src/routes/`
herausgenommen, damit sie Build, Type-Check und Routing nicht mehr beeinflusst
(sie hatte 2 vorbestehende TS-Fehler und ist funktional durch die neue `/app`-App ersetzt).

Design/Flow dieser Version ist verworfen (Handover: „0% Einfluss der alten Optik").
Wiederverwendbar war nur der API-Vertrag — die neue App liegt in `src/routes/app/`
+ `src/lib/app-v2/`. Nicht reaktivieren; bei Bedarf einzelne Muster herauskopieren.
