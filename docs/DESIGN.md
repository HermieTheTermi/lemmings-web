# Design-System: Lemmings Web (Moderne Grafik & Mobile-First)

## 1. Philosophie & Art-Direction
Gegen den generischen Modell-Durchschnitt: Kein Glas-Effekt (Glassmorphism), keine Emojis als Icon-Ersatz, kein Gradient-Text, keine verschachtelten Karten, kein Default-Tailwind-Blau (`#3b82f6`), kein kühler Darkmode mit Neonglühen.

Stattdessen: Eine hochauflösende, vektor-nahe 2D-Handcrafted-Ästhetik inspiriert vom Amiga-Original (1991), aber veredelt mit organischen Verläufen, Kantenlicht, mindestens zwei echten Lichtquellen je Level mit Glanzkernen (Luminanz > 220), weichen Halos, dezentem Bloom, physikalischer Luftperspektive und Retina-Schärfe (`devicePixelRatio` bis 2).

---

## 2. Farbpalette & Warm/Kalt-Kontrast

### A. Tiefen-Atmosphäre & Echte Luftperspektive
In Höhlensystemen streut feiner Dunst und Luftfeuchtigkeit das Umgebungslicht. Gemäß physikalischer Luftperspektive ist die ferne Höhlenwand **heller und entsättigter**, während der unmittelbare Vordergrund **dunkler, satter und kontrastreicher** ist:

- **Gewölbe & Fernster Himmel (Ebene 1, Parallax 0.10):**
  - Horizont-/Dunstlicht: `#3b4d63` (Luminanz 72, Sättigung 0.23)
  - Felsrelief & Adern in der Ferne: `#2d3b4d` (Luminanz 56, Sättigung 0.24)
  - Mittelwert Ferne: **Luminanz ~ 64**, Sättigung ~ 0.24
- **Mittlere Höhlenstrukturen & Pfeiler (Ebene 2, Parallax 0.30):**
  - Hauptfels: `#1b2533` (Luminanz 35, Sättigung 0.28)
  - Relief-Kante: `#29384c` (Luminanz 52)
- **Vordergrund-Silhouetten & Schluchtenbögen (Ebene 3, Parallax 0.60):**
  - Silhouettenkern: `#0b1119` (Luminanz 16, Sättigung 0.35)
  - Kantenabfall: `#141d2a` (Luminanz 27)
  - Mittelwert Vordergrund: **Luminanz ~ 21**, Sättigung ~ 0.35
- **Luftperspektiven-Kontrast:** $\Delta L = 64 - 21 = \mathbf{+43\text{ Stufen}}$ (übertrifft Vorgabe $\ge 20$ Stufen).

### B. Reale Lichtquellen & Glanzkerne (Luminanz > 220)
Jedes Level besitzt mindestens 2 (bis 3) reale Lichtquellen mit additiven Halos und Glanzkernen:
1. **Sonnen-/Tageslichtschacht (Deckenöffnung):**
   - Glanzkern: `#ffffff` bis `#fffbeb` (Luminanz 255)
   - Sonnenschein: `#fef08a` bis `#f59e0b` (Luminanz 235..180)
   - Kegel-Aura: `rgba(254, 240, 138, 0.08)` mit Bloom
2. **Magisches Ausgangsportal (Runic Vortex):**
   - Wirbelkern: `#ffffff` bis `#ecfdf5` (Luminanz 252)
   - Smaragdglanz: `#34d399` bis `#10b981` (Luminanz 185, Sättigung 0.70)
   - Runen-Halo: `rgba(52, 211, 153, 0.25)` mit radialem Bloom
3. **Phosphoreszierende Kristalle & Geoden (Höhlenwand):**
   - Azur-/Cyan-Glanz: `#ffffff` Kern, Halos `#cffafe` $\rightarrow$ `#06b6d4` $\rightarrow$ `#0284c7`
   - Amethyst-Glanz: `#ffffff` Kern, Halos `#f3e8ff` $\rightarrow$ `#c084fc` $\rightarrow$ `#7e22ce`
4. **Vulkanische Magma-Kerne & Schloten:**
   - Glühzentrum: `#ffffff` bis `#fff7ed` (Luminanz 254)
   - Magma-Körper: `#fb923c` bis `#ea580c` bis `#9a3412`

### C. Terrain-Materialien mit Verlauf, Schichtung & Einlagerungen
- **Erde / Lehm (destruierbar):**
  - Oberste Humus-/Moosschicht: `#22c55e` (Lush Grass) mit goldenen Pollenspitzen `#fef08a`
  - Oberflächennaher Lehm: `#784928`
  - Kern / Sediment-Schichtung: Wellenförmige Bänder `#5a351c` und `#432613`
  - Einlagerungen: Kristalline Quarzsprenkel `#e2e8f0` (glänzend), Kiesel `#a3a3a3`, feine Wurzelstränge `#2e1709`
  - 1px Kantenlicht an sonnenzugewandten Oberkanten: `#9c6644`
  - Schatten unter Decken und Vorsprüngen: `#2b160b`
- **Fels / Basalt (destruierbar):**
  - Kern: `#475569` mit Schichtung `#334155`
  - Risskanten & Kantenlicht: `#94a3b8`
- **Stahl / Nieten (unzerstörbar):**
  - Glänzende Oberkante (Specular Highlight): `#e2e8f0`
  - Plattenbasis: `#64748b`
  - Nieten & Vertiefungen: `#1e293b`
- **Wasser:**
  - Oberfläche: bewegte Sinuswellen mit Schaumkämmen `#67e8f9`
  - Körper: transluzentes Ozeanblau `rgba(14, 116, 144, 0.82)`
- **Lava:**
  - Magmakern: pulsierendes Orange/Gold `#f97316` bis `#fbbf24` (Luminanz > 230)
  - Krustenfragmente: `#7c2d12`

---

## 3. Figuren in doppelter Auflösung & klare Posen (24x24 / Vektor)

- **Kutte & Körper:**
  - Basisfarbe: `#15803d` bis `#22c55e` mit feinem linearen Stoffverlauf
  - Kontur: dunkle 1px Waldgrün-Einfassung `#0f4a21`
  - Glanzfalte: feiner Lichtreflex an der exponierten Schulter `#86efac`
- **Amiga-Haartolle:**
  - Basis: `#9333ea` (Sattes Violett/Magenta)
  - Glanzsträhne: `#e879f9` (Hellviolett, glänzendes Licht)
  - Haartuff-Kontur: `#581c87`
- **Gesicht & Gliedmaßen:**
  - Haut: warmer Pfirsichton `#fed7aa` mit weicher Wange `#fba978`
  - Stiefel: robustes Leder `#451a03`
- **Posen je Fähigkeit (eindeutig lesbare Silhouetten):**
  - **Walker:** geschmeidiger 8-Frame Laufzyklus mit federndem Haarschwung
  - **Faller:** flatternde Haare nach oben, rudernde Ärmel, flatternder Saum
  - **Floater:** aufgespannter Schirm mit gelb-roten Streifen (`#f59e0b` / `#dc2626`), leise wogend
  - **Climber:** athletisches Greifen nach Felsvorsprüngen mit abwechselnden Händen
  - **Blocker:** breiter Stand, ausgebreitete Hände, pulsierender roter/oranger Warnkreis
  - **Builder:** Maurer-Pose, gezimmertes Stufenbrett mit Holzmaserung
  - **Basher:** wuchtiger Schwung mit Spitzhacke und Steinstaub-Wolken
  - **Miner:** diagonaler Hieb mit Spitzhacke und Splittern
  - **Digger:** senkrechter Spatenstich mit Erdbröckeln
  - **Bomber:** leuchtende Countdown-Blase (5..1) mit Zündfunken
  - **Splat:** comic-flache Silhouette mit Sternchen
- **Auswahl-Reticle:**
  - Bei Hover/Auswahl: hochauflösendes Fadenkreuz mit vier eckigen Klammern `#fbbf24` und dezentem Pulsieren.

---

## 4. Modernes HUD & Oberfläche

### A. Typografie-Skala (System-Monospace mit tabellarischen Ziffern)
```css
font-family: ui-monospace, 'SF Mono', 'Cascadia Code', 'Segoe UI Mono', monospace, sans-serif;
font-variant-numeric: tabular-nums;
```

| Element | Schriftgröße | Gewicht | Farbe | Ausrichtung |
|---|---|---|---|---|
| Level-Titel | 14px | 700 (Bold) | `#f8fafc` | Links |
| Level-Untertitel | 11px | 500 (Medium) | `#94a3b8` | Links |
| Counter Labels | 10px | 600 (Semibold) | `#64748b` | Zentriert/Block |
| Counter Werte | 15px | 700 (Bold) | `#f8fafc` / `#34d399` | Tabellarisch |
| Button Code | 12px | 700 (Bold) | `#f1f5f9` | Zentriert |
| Button Badge | 12px | 700 (Bold) | `#fbbf24` (Selected: `#0f172a`) | Rechts oben |

### B. Dynamischer Zeit-Fortschrittsbalken
- Direkter optischer Indikator der Restzeit im oberen HUD:
  - Track: `#1e293b` (Höhe 3px, Radius 2px)
  - Balken:
    - Normalzeit ($> 50\%$): Smaragdgrün `#10b981`
    - Halbzeit ($20\%\text{–}50\%$): Bernsteingold `#f59e0b`
    - Schlussphase ($< 20\%$): Warnrot `#ef4444` mit dezentem 1Hz Pulsieren

### C. UI-Zustände (Buttons & Steuerung)
1. **Normal (Idle):** Hintergrund `#1e2430`, Rahmen `#334155`, Text `#f1f5f9`, Schatten `0 2px 0 #0f131a`.
2. **Hover / Touch-Pressed:** Hintergrund `#283142`, `transform: translateY(1px)`, Schatten `0 1px 0 #0f131a`.
3. **Selected:** Hintergrund `#2a2416`, Rahmen `2px solid #f59e0b`, Text `#fbbf24`, Badge `#f59e0b` mit Text `#0f172a`.
4. **Empty (Budget = 0):** Text `#64748b`, Deckkraft `0.45`, Cursor `not-allowed`.
5. **Locked (Level gesperrt):** Hintergrund `#131720`, Rahmen `#1e2533`, Text `#475569`, Vorhängeschloss-Badge.

### D. Motion-Timings & Übergänge
- Tasten-Klick & Hover: `150ms cubic-bezier(0.2, 0, 0, 1)`
- Zustandswechsel & Modale: `200ms cubic-bezier(0, 0, 0.2, 1)`
- Zeitbalken-Fortschritt: flüssig synchron zur Simulationszeit

---

## 5. Touch-Bedienung & Barrierefreiheit
- Alle Touch-Ziele in der Daumenzone $\ge 48\text{px} \times 48\text{px}$.
- Safe-Area-Insets (`env(safe-area-inset-bottom)`) vollständig berücksichtigt.
- Treffer-Feedback: goldener Expansionskreis bei erfolgreicher Zuweisung, silbergrauer Impuls bei Verfehlen.
