import { MATERIAL } from './terrain.js';
import { SKILL } from './lemming.js';

export const LEVELS = [
  {
    id: 1,
    name: '1. Der erste Schritt',
    subtitle: 'Graben und Brücken bauen',
    width: 800,
    height: 400,
    totalLemmings: 10,
    targetRescuePercent: 80, // 8 von 10
    spawnInterval: 50,
    timeLimit: 120,
    spawnPos: { x: 80, y: 50 },
    initialFocusPos: { x: 140, y: 175 },
    exitPos: { x: 680, y: 138, w: 32, h: 32 },
    lights: [
      { x: 85, y: 30, radius: 95, color: '#fef08a', coreColor: '#ffffff', type: 'shaft' },
      { x: 696, y: 154, radius: 75, color: '#10b981', coreColor: '#ffffff', type: 'portal' },
      { x: 230, y: 125, radius: 45, color: '#06b6d4', coreColor: '#ffffff', type: 'crystal' },
    ],
    skills: {
      [SKILL.CLIMBER]: 0,
      [SKILL.FLOATER]: 0,
      [SKILL.BOMBER]: 1,
      [SKILL.BLOCKER]: 1,
      [SKILL.BUILDER]: 2,
      [SKILL.BASHER]: 1,
      [SKILL.MINER]: 0,
      [SKILL.DIGGER]: 0,
    },
    setupTerrain: (terrain) => {
      // Höhlendecke
      terrain.fillRect(0, 0, 60, 40, MATERIAL.EARTH);
      terrain.fillRect(110, 0, 690, 40, MATERIAL.EARTH);
      // Linke und rechte Felswand
      terrain.fillRect(0, 40, 40, 260, MATERIAL.EARTH);
      terrain.fillRect(750, 40, 50, 260, MATERIAL.EARTH);
      // Startplattform (y=90)
      terrain.fillRect(40, 90, 140, 50, MATERIAL.EARTH);
      // Mittlere Terrasse (y=140, x=160..300)
      terrain.fillRect(160, 140, 140, 40, MATERIAL.EARTH);
      // Verbindungsplateau (y=130, x=306..340)
      terrain.fillRect(306, 130, 34, 50, MATERIAL.EARTH);
      // Felswand vor dem Ausgang (x=340..375, y=70..180)
      terrain.fillRect(340, 70, 35, 110, MATERIAL.EARTH);
      // Zielplateau (y=170, x=375..750)
      terrain.fillRect(375, 170, 375, 70, MATERIAL.EARTH);
      // Massives Höhlenfundament / Grundgestein
      terrain.fillRect(0, 240, 800, 160, MATERIAL.EARTH);
      // Organische Konturen & Tropfsteine
      terrain.applyOrganicContours(LEVELS[0]);
    },
  },
  {
    id: 2,
    name: '2. Tiefer Abgrund',
    subtitle: 'Nur Fallschirme überleben den Sturz',
    width: 800,
    height: 400,
    totalLemmings: 12,
    targetRescuePercent: 75, // 9 von 12
    spawnInterval: 40,
    timeLimit: 150,
    spawnPos: { x: 100, y: 40 },
    initialFocusPos: { x: 100, y: 190 },
    exitPos: { x: 680, y: 310, w: 32, h: 32 },
    lights: [
      { x: 105, y: 25, radius: 100, color: '#fef08a', coreColor: '#ffffff', type: 'shaft' },
      { x: 696, y: 326, radius: 80, color: '#10b981', coreColor: '#ffffff', type: 'portal' },
      { x: 375, y: 340, radius: 55, color: '#38bdf8', coreColor: '#ffffff', type: 'crystal' },
    ],
    skills: {
      [SKILL.CLIMBER]: 0,
      [SKILL.FLOATER]: 12,
      [SKILL.BOMBER]: 1,
      [SKILL.BLOCKER]: 1,
      [SKILL.BUILDER]: 4,
      [SKILL.BASHER]: 1,
      [SKILL.MINER]: 0,
      [SKILL.DIGGER]: 0,
    },
    setupTerrain: (terrain) => {
      // Höhlendecke
      terrain.fillRect(0, 0, 80, 35, MATERIAL.EARTH);
      terrain.fillRect(125, 0, 675, 45, MATERIAL.EARTH);
      // Startklippe
      terrain.fillRect(40, 80, 140, 260, MATERIAL.EARTH);
      terrain.fillRect(0, 35, 40, 305, MATERIAL.EARTH);
      // Talboden
      terrain.fillRect(0, 340, 800, 60, MATERIAL.EARTH);
      // Wasserloch
      terrain.fillRect(360, 340, 30, 60, MATERIAL.WATER);
      // Hügel & Zielwand
      terrain.fillRect(390, 340, 350, 60, MATERIAL.EARTH);
      terrain.fillRect(520, 260, 40, 140, MATERIAL.EARTH);
      terrain.fillRect(740, 280, 60, 120, MATERIAL.EARTH);
      // Bergmassiv oben rechts
      terrain.fillRect(480, 45, 320, 180, MATERIAL.EARTH);
      // Organische Konturen & Tropfsteine
      terrain.applyOrganicContours(LEVELS[1]);
    },
  },
  {
    id: 3,
    name: '3. Sackgasse & Sprengmeister',
    subtitle: 'Blockieren, Graben und Sprengen',
    width: 800,
    height: 400,
    totalLemmings: 15,
    targetRescuePercent: 70, // 11 von 15
    spawnInterval: 35,
    timeLimit: 180,
    spawnPos: { x: 80, y: 50 },
    initialFocusPos: { x: 100, y: 170 },
    exitPos: { x: 680, y: 148, w: 32, h: 32 },
    lights: [
      { x: 180, y: 25, radius: 90, color: '#fef08a', coreColor: '#ffffff', type: 'shaft' },
      { x: 696, y: 164, radius: 75, color: '#10b981', coreColor: '#ffffff', type: 'portal' },
      { x: 390, y: 150, radius: 50, color: '#c084fc', coreColor: '#ffffff', type: 'crystal' },
    ],
    skills: {
      [SKILL.CLIMBER]: 0,
      [SKILL.FLOATER]: 0,
      [SKILL.BOMBER]: 1,
      [SKILL.BLOCKER]: 1,
      [SKILL.BUILDER]: 0,
      [SKILL.BASHER]: 1,
      [SKILL.MINER]: 0,
      [SKILL.DIGGER]: 1,
    },
    setupTerrain: (terrain) => {
      // Höhlendecke
      terrain.fillRect(0, 0, 60, 40, MATERIAL.EARTH);
      terrain.fillRect(110, 0, 690, 45, MATERIAL.EARTH);
      // Seitenwände
      terrain.fillRect(0, 40, 45, 260, MATERIAL.EARTH);
      terrain.fillRect(750, 40, 50, 260, MATERIAL.EARTH);
      // Startplattform (y=90)
      terrain.fillRect(40, 90, 150, 45, MATERIAL.EARTH);
      // Obere Kammer-Terrasse (y=135, x=160..380)
      terrain.fillRect(160, 135, 220, 35, MATERIAL.EARTH);
      terrain.fillRect(360, 65, 40, 90, MATERIAL.EARTH);
      // Untere Galerie (y=180, x=240..750)
      terrain.fillRect(240, 180, 510, 40, MATERIAL.EARTH);
      terrain.fillRect(480, 120, 40, 60, MATERIAL.EARTH);
      terrain.fillRect(520, 45, 240, 95, MATERIAL.EARTH);
      // Höhlenfundament
      terrain.fillRect(0, 220, 800, 180, MATERIAL.EARTH);
      // Organische Konturen & Tropfsteine
      terrain.applyOrganicContours(LEVELS[2]);
    },
  },
  {
    id: 4,
    name: '4. Untertagebau',
    subtitle: 'Stahlplatten und 45°-Schächte',
    width: 800,
    height: 400,
    totalLemmings: 16,
    targetRescuePercent: 75, // 12 von 16
    spawnInterval: 35,
    timeLimit: 180,
    spawnPos: { x: 100, y: 50 },
    initialFocusPos: { x: 90, y: 170 },
    exitPos: { x: 680, y: 218, w: 32, h: 32 },
    lights: [
      { x: 105, y: 30, radius: 85, color: '#fef08a', coreColor: '#ffffff', type: 'lantern' },
      { x: 696, y: 234, radius: 75, color: '#10b981', coreColor: '#ffffff', type: 'portal' },
      { x: 340, y: 180, radius: 50, color: '#fbbf24', coreColor: '#ffffff', type: 'crystal' },
    ],
    skills: {
      [SKILL.CLIMBER]: 0,
      [SKILL.FLOATER]: 0,
      [SKILL.BOMBER]: 1,
      [SKILL.BLOCKER]: 1,
      [SKILL.BUILDER]: 2,
      [SKILL.BASHER]: 1,
      [SKILL.MINER]: 1,
      [SKILL.DIGGER]: 0,
    },
    setupTerrain: (terrain) => {
      // Grubendecke
      terrain.fillRect(0, 0, 80, 40, MATERIAL.EARTH);
      terrain.fillRect(130, 0, 670, 45, MATERIAL.EARTH);
      // Seitenwände
      terrain.fillRect(0, 40, 50, 260, MATERIAL.EARTH);
      terrain.fillRect(750, 40, 50, 260, MATERIAL.EARTH);
      // Startgalerie mit Pfeiler
      terrain.fillRect(40, 90, 160, 110, MATERIAL.EARTH);
      // Schacht-Terrasse (y=140)
      terrain.fillRect(170, 140, 150, 30, MATERIAL.EARTH);
      terrain.fillRect(290, 100, 20, 40, MATERIAL.STEEL);
      // Untere Galerie (y=200)
      terrain.fillRect(270, 200, 190, 35, MATERIAL.EARTH);
      terrain.fillRect(468, 190, 32, 50, MATERIAL.EARTH);
      terrain.fillRect(500, 120, 35, 120, MATERIAL.EARTH);
      terrain.fillRect(535, 220, 215, 60, MATERIAL.EARTH);
      terrain.fillRect(480, 45, 280, 75, MATERIAL.EARTH);
      terrain.fillRect(0, 240, 800, 160, MATERIAL.EARTH);
      // Organische Konturen & Tropfsteine
      terrain.applyOrganicContours(LEVELS[3]);
    },
  },
  {
    id: 5,
    name: '5. Feuer und Lava',
    subtitle: 'Bau dir den Weg über die Glut',
    width: 800,
    height: 400,
    totalLemmings: 18,
    targetRescuePercent: 75, // 14 von 18
    spawnInterval: 30,
    timeLimit: 180,
    spawnPos: { x: 70, y: 70 },
    initialFocusPos: { x: 90, y: 170 },
    exitPos: { x: 700, y: 118, w: 32, h: 32 },
    lights: [
      { x: 350, y: 280, radius: 110, color: '#f97316', coreColor: '#ffffff', type: 'lava' },
      { x: 520, y: 280, radius: 110, color: '#f97316', coreColor: '#ffffff', type: 'lava' },
      { x: 716, y: 134, radius: 75, color: '#10b981', coreColor: '#ffffff', type: 'portal' },
    ],
    skills: {
      [SKILL.CLIMBER]: 0,
      [SKILL.FLOATER]: 0,
      [SKILL.BOMBER]: 1,
      [SKILL.BLOCKER]: 1,
      [SKILL.BUILDER]: 2,
      [SKILL.BASHER]: 1,
      [SKILL.MINER]: 0,
      [SKILL.DIGGER]: 0,
    },
    setupTerrain: (terrain) => {
      // Höhlendecke
      terrain.fillRect(0, 0, 50, 45, MATERIAL.EARTH);
      terrain.fillRect(100, 0, 700, 45, MATERIAL.EARTH);
      // Seitenwände
      terrain.fillRect(0, 45, 45, 255, MATERIAL.EARTH);
      terrain.fillRect(750, 45, 50, 255, MATERIAL.EARTH);
      // Startklippe
      terrain.fillRect(30, 120, 160, 130, MATERIAL.EARTH);
      // Schwebender Basaltpfeiler
      terrain.fillRect(198, 108, 42, 142, MATERIAL.EARTH);
      // Zielberg
      terrain.fillRect(240, 150, 510, 100, MATERIAL.EARTH);
      terrain.fillRect(480, 90, 35, 80, MATERIAL.EARTH);
      terrain.fillRect(520, 45, 230, 80, MATERIAL.EARTH);
      // Lavasee und Fundament
      terrain.fillRect(0, 250, 800, 150, MATERIAL.LAVA);
      terrain.fillRect(0, 320, 800, 80, MATERIAL.EARTH);
      // Organische Konturen & Tropfsteine
      terrain.applyOrganicContours(LEVELS[4]);
    },
  },
  {
    id: 6,
    name: '6. Die Festung',
    subtitle: 'Das finale Meisterstück',
    width: 800,
    height: 400,
    totalLemmings: 20,
    targetRescuePercent: 80, // 16 von 20
    spawnInterval: 25,
    timeLimit: 210,
    spawnPos: { x: 80, y: 40 },
    initialFocusPos: { x: 95, y: 170 },
    exitPos: { x: 700, y: 138, w: 32, h: 32 },
    lights: [
      { x: 140, y: 110, radius: 65, color: '#f59e0b', coreColor: '#ffffff', type: 'brazier' },
      { x: 420, y: 25, radius: 90, color: '#fef08a', coreColor: '#ffffff', type: 'shaft' },
      { x: 716, y: 154, radius: 75, color: '#10b981', coreColor: '#ffffff', type: 'portal' },
    ],
    skills: {
      [SKILL.CLIMBER]: 0,
      [SKILL.FLOATER]: 0,
      [SKILL.BOMBER]: 1,
      [SKILL.BLOCKER]: 1,
      [SKILL.BUILDER]: 2,
      [SKILL.BASHER]: 1,
      [SKILL.MINER]: 0,
      [SKILL.DIGGER]: 0,
    },
    setupTerrain: (terrain) => {
      // Festungsdecke
      terrain.fillRect(0, 0, 60, 40, MATERIAL.EARTH);
      terrain.fillRect(110, 0, 690, 45, MATERIAL.EARTH);
      // Turmmauern
      terrain.fillRect(0, 40, 45, 260, MATERIAL.EARTH);
      terrain.fillRect(750, 40, 50, 260, MATERIAL.EARTH);
      // Startturm
      terrain.fillRect(40, 90, 130, 130, MATERIAL.EARTH);
      // Vorhof
      terrain.fillRect(170, 135, 130, 85, MATERIAL.EARTH);
      // Wasserburggraben
      terrain.fillRect(300, 135, 8, 85, MATERIAL.WATER);
      terrain.fillRect(308, 135, 152, 85, 1);
      // Festungstor
      terrain.fillRect(460, 75, 35, 105, MATERIAL.EARTH);
      terrain.fillRect(495, 160, 255, 60, MATERIAL.EARTH);
      terrain.fillRect(520, 45, 230, 80, MATERIAL.EARTH);
      // Burgfundament
      terrain.fillRect(0, 220, 800, 180, MATERIAL.EARTH);
      // Organische Konturen & Tropfsteine
      terrain.applyOrganicContours(LEVELS[5]);
    },
  },
];
