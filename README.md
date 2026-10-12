# Kleine Helfer — Lemmings-Klon als Web-Spiel

**Status: spielbarer Prototyp, im Browser und auf dem Handy getestet.** Kein Build-Schritt, kein
npm, keine Fremdassets — reines HTML/CSS/JavaScript (Canvas 2D), statisch ausgeliefert und offline
lauffähig. Alle Grafiken sind im Repo selbst gezeichnet, es stammt keine Datei aus dem Original.

Ein Fan-Remake der Spielmechanik von *Lemmings* (DMA Design, 1991): Die Figuren laufen von selbst —
du greifst von außen ein, indem du ihnen Fähigkeiten zuweist, und bringst so eine Rettungsquote ins
Ziel. Kein Zusammenhang mit den Rechteinhabern, keine kommerzielle Absicht, nur ein Technikprojekt.

## Spielen

- Online (GitHub Pages): **https://hermiethetermi.github.io/lemmings-web/**
- Lokal: `node scripts/server.mjs` starten und `http://127.0.0.1:8085/` öffnen
  (jeder andere statische Server geht auch; ein Server ist nötig, weil ES-Module und Service Worker
  über `file://` nicht laden).

**Bedienung (Handy, Touch-first)**

1. Unten eine Fähigkeit antippen (Restzahl steht auf der Taste; gedimmte Tasten sind leer).
2. Die Figur antippen, der die Fähigkeit zugewiesen werden soll.
3. Ein Finger schiebt die Kamera, zwei Finger zoomen, Pause/`×2`/Neustart sind dauerhaft erreichbar.

**Tastatur (Desktop):** `1`–`8` wählt die Fähigkeit, Klick weist sie zu, `Leertaste`/`P` Pause,
`F` Zeitraffer, `R` Neustart, `Esc` Level-Auswahl, `M` Ton, `+`/`-` Zoom.

## Was drin ist

- **8 Fähigkeiten** mit eigener Physik: Kletterer, Schirm, Bombe, Blocker, Bauer, Hascher, Bergmann,
  Gräber — inklusive Sturzschaden, Wasser, Lava, Stahl (unzerstörbar) und Ausgang.
- **6 Level** mit steigender Schwierigkeit, Level-Ziel (Rettungsquote), Fähigkeiten-Budget,
  Zeitlimit, Fortschritt lokal gespeichert.
- **Jedes Level verlangt mindestens drei Fähigkeiten** und enthält einen Moment, in dem die Herde
  aufgehalten werden muss (Blocker, Bauerkante, Sprengung). Die Lösung jedes Levels liegt als
  Datensatz im Repo und wird getestet.
- **Mobile-first:** Hoch- und Querformat, Safe-Areas, Trefferzone 24 px, kein horizontales Scrollen.
- **Retina-scharf** (Zeichenfläche an `devicePixelRatio` gekoppelt, bis 2×), Parallax-Tiefe,
  Lichtquellen mit Bloom, Luftperspektive, animierte Materialien.
- **Offline-fähig** als PWA; aktualisiert sich über Network-First sofort, ohne im Cache zu hängen.

## Nachweis-Stand (gemessen, nicht behauptet)

| Prüfung | Ergebnis |
|---|---|
| Unit-/Integrationstests (`node --test`) | **57/57 grün** |
| Lösbarkeit aller Level (Headless-Simulation) | 6/6 siegreich, jeweils mit Mindest-Fähigkeitenzahl und Minimalitätsprüfung |
| Touch-Runner im echten Browser (Playwright, echte Touch-Events, 390×844) | 6/6 Level gewonnen: 90 / 92 / 93 / 94 / 94 / 95 % gerettet, 0 Konsolenfehler |
| Landschaftsdeckung im Standardblick | 45–84 % je Level und Format (Ziel ≥ 45 %) |
| Figurgröße im Hochformat | 26,4 px = 4,1 % der Bildhöhe (Ziel ≥ 2,5 %) |
| Bildzeit (sichtbarer Tab, Level mit 20 Figuren, dpr 2) | Median 16,7 ms, p95 18,6 ms |
| Offline nach Serverabschaltung | lädt und spielt weiter (Service Worker) |
| Live-Update mit aktivem Service Worker | neue Dateien kommen nach dem Reload an |

## Aufbau

```
index.html                  Einstiegspunkt
css/style.css               Oberfläche, HUD, Responsive-Regeln
js/main.js                  Spielschleife, Levelwechsel, Verkabelung
js/engine/terrain.js        Landschaft: Materialmaske, Graben, organische Konturen
js/engine/lemming.js        Figur: Zustandsmaschine, alle 8 Fähigkeiten, Physik
js/engine/level.js          Levelablauf: Spawn-Takt, Budget, Wertung, Sieg/Niederlage
js/engine/levels-data.js    6 Level: Geometrie, Ziel, Budget, Lichtquellen
js/engine/solutions-data.js Lösungswege je Level (Grundlage der Lösbarkeits-Tests)
js/graphics/renderer.js     Zeichnen: Kamera, Parallax, Licht, Partikel, HUD-Anbindung
js/graphics/sprites.js      Figuren, Falltür, Ausgang (prozedural gezeichnet)
js/ui/hud.js                Anzeige: Zähler, Fähigkeitenleiste, Dialoge, Zeitbalken
js/ui/input.js              Touch/Pointer/Tastatur: Tippen, Ziehen, Pinch-Zoom
js/audio/sound.js           Web-Audio-Effekte (ohne Dateien)
scripts/                    lokaler Server, Selbsttests (Touch-Runner, Screenshots, Offline, SW)
tests/                       Testsuite (node:test)
docs/DESIGN.md               Design-System: Palette, Lichtsystem, Zustände, Messwerte
docs/shots/                  aktuelle Screenshots je Format
```

## Selbsttests ausführen

```bash
node --test                     # komplette Suite
node scripts/solve-runner.mjs   # spielt alle Level im Browser über echte Touch-Events durch
node scripts/visual-verify.mjs  # Screenshots + Bildzeit
node scripts/offline-verify.mjs # Offline-Nachweis (stoppt den Server selbst)
node scripts/verify-sw-update.mjs
```

Voraussetzung: Node ≥ 20 und für die Browser-Skripte ein installiertes Playwright-Chromium.

## Grenzen (ehrlich)

- Das Spiel ist ein Prototyp: 6 Level, keine Level-Editor-Oberfläche, kein Netzwerk-Modus,
  keine Bestenlisten.
- Die Farbwelt ist durchgehend dunkel (Höhlenlicht) — keine Tageslicht-Varianten.
- Ein Zielwert der Lichtmessung wird im Hochformat bei Level 5 gerissen (0,01 % sehr helle Pixel
  statt 0,10 %); in allen anderen Kombinationen liegt er darüber.
- Audio ist im Browser geprüft, nicht auf einem echten iPhone (Safari entsperrt den Audiokontext
  erst nach einer Nutzerinteraktion — der Handler dafür ist eingebaut, aber nicht auf Hardware belegt).

## Lizenz und Hinweise

MIT — siehe [LICENSE](LICENSE). Der Name *Lemmings* und die Spielidee gehören ihren jeweiligen
Rechteinhabern; dieses Projekt ist eine unabhängige Nachbildung der Mechanik mit ausschließlich
selbst erstellten Grafiken und ohne jede Verbindung zu den Rechteinhabern.
