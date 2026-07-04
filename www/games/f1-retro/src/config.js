// Game and Racing Configurations
const GAME_WIDTH = 960;
const GAME_HEIGHT = 960;

const CAR_COLORS = {
    blue: { primary: '#3b82f6', secondary: '#1e3a8a', name: 'PLAYER' },
    red: { primary: '#ef4444', secondary: '#7f1d1d', name: 'AI RED' },
    yellow: { primary: '#eab308', secondary: '#713f12', name: 'AI YELLOW' },
    green: { primary: '#22c55e', secondary: '#14532d', name: 'AI GREEN' },
    orange: { primary: '#f97316', secondary: '#7c2d12', name: 'AI ORANGE' },
    purple: { primary: '#a855f7', secondary: '#581c87', name: 'AI PURPLE' },
    cyan: { primary: '#06b6d4', secondary: '#164e63', name: 'AI CYAN' },
    pink: { primary: '#ec4899', secondary: '#701a75', name: 'AI PINK' },
    white: { primary: '#f3f4f6', secondary: '#374151', name: 'AI WHITE' },
    dark: { primary: '#1f2937', secondary: '#030712', name: 'AI DARK' },
    gold: { primary: '#d97706', secondary: '#78350f', name: 'AI GOLD' },
    teal: { primary: '#14b8a6', secondary: '#134e4a', name: 'AI TEAL' }
};

const AI_NAMES = [
    "MAX", "LEWIS", "CHARLES", "LANDO", "VALTTERI", 
    "CHECO", "CARLOS", "GEORGE", "FERNANDO", "ESTEBAN", 
    "YUKI", "PIERRE", "ALEX", "LOGAN", "NICO", "KEVIN"
];

const TRACKS_DATA = {
    classic: {
        name: "Classic GP Circuit",
        laps: 3,
        trackWidth: 105,
        // Centerline waypoints defining the track path
        centerline: [
            { x: 300, y: 720 }, // Starting Grid Row 2
            { x: 200, y: 710 }, // Starting Grid Row 1
            { x: 120, y: 640 }, // Entering Left U-Turn
            { x: 90,  y: 500 }, // Left U-Turn Apex
            { x: 120, y: 360 }, // Exiting Left U-Turn
            { x: 220, y: 300 }, // Heading towards chicane
            { x: 420, y: 300 }, 
            { x: 580, y: 220 }, // Upwards curve
            { x: 620, y: 140 }, // Apex at top
            { x: 700, y: 130 },
            { x: 740, y: 200 }, // Descending
            { x: 640, y: 380 }, // S-Bend entry
            { x: 720, y: 460 }, // Chicane bottom
            { x: 880, y: 380 }, // Chicane exit
            { x: 1050, y: 220 }, // Right-hand sweep top
            { x: 1120, y: 300 }, // Sweeping back
            { x: 1110, y: 440 }, 
            { x: 1000, y: 560 }, // Going left down
            { x: 860, y: 620 },
            { x: 700, y: 680 }, // Heading to home straight
            { x: 500, y: 715 }, // Start grid preparation
            { x: 400, y: 720 }
        ],
        // Polygon regions where gravel traps are located
        gravelZones: [
            // Middle large gravel trap in the screenshot
            [
                { x: 260, y: 360 },
                { x: 450, y: 360 },
                { x: 450, y: 550 },
                { x: 380, y: 640 },
                { x: 300, y: 600 }
            ],
            // Outer gravel trap at the top right sweep
            [
                { x: 800, y: 100 },
                { x: 960, y: 130 },
                { x: 1100, y: 100 },
                { x: 1050, y: 200 },
                { x: 920, y: 230 }
            ],
            // Chicane gravel trap
            [
                { x: 740, y: 480 },
                { x: 840, y: 460 },
                { x: 860, y: 540 },
                { x: 780, y: 570 }
            ]
        ],
        decorations: {
            // Trees: concentric green circles
            trees: [],
            // Stacks of tires: concentric dark circles
            tires: [
                // Inner U-turn tires barrier (screenshot)
                { x: 260, y: 420 }, { x: 265, y: 435 }, { x: 270, y: 450 }, 
                { x: 278, y: 465 }, { x: 288, y: 480 }, { x: 300, y: 495 },
                { x: 310, y: 510 }, { x: 318, y: 525 }, { x: 324, y: 540 },
                // Outer corners tires barrier
                { x: 50, y: 290 }, { x: 55, y: 275 }, { x: 62, y: 260 },
                { x: 70, y: 245 }, { x: 80, y: 230 },
                { x: 600, y: 760 }, { x: 620, y: 762 }, { x: 640, y: 763 },
                { x: 660, y: 762 }, { x: 680, y: 758 }, { x: 700, y: 750 },
                { x: 720, y: 740 }, { x: 740, y: 728 }, { x: 760, y: 715 }
            ],
            // Spectator stands
            stands: [
                {
                    points: [{ x: 850, y: 750 }, { x: 980, y: 670 }, { x: 950, y: 620 }, { x: 820, y: 700 }],
                    density: 15, // Number of spectator dots
                    direction: -45 // Angle they face
                },
                {
                    points: [{ x: 1040, y: 640 }, { x: 1140, y: 560 }, { x: 1110, y: 510 }, { x: 1010, y: 590 }],
                    density: 12,
                    direction: -45
                },
                {
                    points: [{ x: 1100, y: 390 }, { x: 1160, y: 390 }, { x: 1160, y: 490 }, { x: 1100, y: 490 }],
                    density: 10,
                    direction: 180
                }
            ]
        }
    },
    monza: {
        name: "Monza Speed Oval",
        laps: 3,
        trackWidth: 110,
        centerline: [
            { x: 200, y: 680 },
            { x: 100, y: 550 },
            { x: 100, y: 250 },
            { x: 200, y: 120 },
            { x: 500, y: 120 },
            { x: 600, y: 220 },
            { x: 550, y: 320 },
            { x: 650, y: 400 },
            { x: 850, y: 380 },
            { x: 1050, y: 200 },
            { x: 1120, y: 300 },
            { x: 1100, y: 550 },
            { x: 950, y: 680 },
            { x: 500, y: 680 }
        ],
        gravelZones: [
            [
                { x: 80, y: 80 },
                { x: 220, y: 80 },
                { x: 120, y: 200 }
            ],
            [
                { x: 1050, y: 550 },
                { x: 1150, y: 650 },
                { x: 950, y: 720 }
            ]
        ],
        decorations: {
            trees: [],
            tires: [
                { x: 60, y: 180 }, { x: 60, y: 200 }, { x: 60, y: 220 },
                { x: 1140, y: 400 }, { x: 1140, y: 420 }, { x: 1140, y: 440 }
            ],
            stands: [
                {
                    points: [{ x: 300, y: 710 }, { x: 450, y: 710 }, { x: 450, y: 750 }, { x: 300, y: 750 }],
                    density: 12,
                    direction: 90
                }
            ]
        }
    },
    hairpin: {
        name: "Hairpin Madness",
        laps: 4,
        trackWidth: 95,
        centerline: [
            { x: 200, y: 700 },
            { x: 100, y: 580 },
            { x: 250, y: 450 },
            { x: 100, y: 320 },
            { x: 250, y: 180 },
            { x: 550, y: 150 },
            { x: 700, y: 280 },
            { x: 650, y: 420 },
            { x: 850, y: 480 },
            { x: 1050, y: 350 },
            { x: 1100, y: 550 },
            { x: 950, y: 700 },
            { x: 550, y: 700 }
        ],
        gravelZones: [
            [
                { x: 280, y: 420 },
                { x: 320, y: 450 },
                { x: 280, y: 480 }
            ]
        ],
        decorations: {
            trees: [],
            tires: [
                { x: 80, y: 450 }, { x: 90, y: 450 },
                { x: 1120, y: 450 }, { x: 1130, y: 470 }
            ],
            stands: [
                {
                    points: [{ x: 400, y: 70 }, { x: 550, y: 70 }, { x: 550, y: 110 }, { x: 400, y: 110 }],
                    density: 10,
                    direction: 270
                }
            ]
        }
    }
};
