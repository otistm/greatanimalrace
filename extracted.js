const SHAPES = [
            /* 0: Large Square (120x120) */ { pts: [[-60,-60], [60,-60], [60,60], [-60,60]] },
            /* 1: Large Tri (120x120)    */ { pts: [[-60,-60], [60,60], [-60,60]] },
            /* 2: Rect (120x60)          */ { pts: [[-60,-30], [60,-30], [60,30], [-60,30]] },
            /* 3: Square (60x60)         */ { pts: [[-30,-30], [30,-30], [30,30], [-30,30]] },
            /* 4: Small Tri (60x60)      */ { pts: [[-30,-30], [30,30], [-30,30]] }
        ];

        // Fold sequences (What shape it becomes when you hit FOLD)
        const PAPER_TYPES = [
            { sequence: [0, 1] },       // Type 0: Large Square -> Large Triangle
            { sequence: [2, 3, 4] }     // Type 1: Rectangle -> Square -> Small Triangle
        ];

        // Levels Database
        const LEVELS = [
            {
                name: "BUNNY",
                slots: [
                    { x: 200, y: 250, shape: 3, rot: 0 }, // Body
                    { x: 200, y: 160, shape: 2, rot: 1 }, // Ears
                    { x: 140, y: 250, shape: 4, rot: 1 }  // Tail
                ],
                pieces: [
                    { type: 1, x: 80, y: 450, color: '#ff7eb3', fold: 0, rot: 0 },
                    { type: 1, x: 200, y: 450, color: '#a18cd1', fold: 0, rot: 0 },
                    { type: 1, x: 320, y: 450, color: '#fbc2eb', fold: 0, rot: 0 }
                ]
            },
            {
                name: "FISH",
                slots: [
                    { x: 200, y: 250, shape: 1, rot: 0 }, // Body
                    { x: 110, y: 250, shape: 3, rot: 0 }, // Tail
                    { x: 170, y: 160, shape: 4, rot: 2 }  // Fin
                ],
                pieces: [
                    { type: 0, x: 100, y: 450, color: '#ff9a9e', fold: 0, rot: 0 },
                    { type: 1, x: 220, y: 450, color: '#84fab0', fold: 0, rot: 0 },
                    { type: 1, x: 320, y: 450, color: '#8fd3f4', fold: 0, rot: 0 }
                ]
            },
            {
                name: "HOUSE",
                slots: [
                    { x: 200, y: 300, shape: 2, rot: 0 }, // Base
                    { x: 170, y: 240, shape: 4, rot: 0 }, // Roof Left
                    { x: 230, y: 240, shape: 4, rot: 1 }  // Roof Right
                ],
                pieces: [
                    { type: 1, x: 80, y: 450, color: '#fccb90', fold: 0, rot: 0 },
                    { type: 1, x: 200, y: 450, color: '#d57eeb', fold: 0, rot: 0 },
                    { type: 1, x: 320, y: 450, color: '#e0c3fc', fold: 0, rot: 0 }
                ]
            },
            {
                name: "PINWHEEL",
                slots: [
                    { x: 230, y: 170, shape: 4, rot: 0 }, // Top Right
                    { x: 230, y: 230, shape: 4, rot: 1 }, // Bottom Right
                    { x: 170, y: 230, shape: 4, rot: 2 }, // Bottom Left
                    { x: 170, y: 170, shape: 4, rot: 3 }  // Top Left
                ],
                pieces: [
                    { type: 1, x: 50, y: 450, color: '#ff0844', fold: 0, rot: 0 },
                    { type: 1, x: 150, y: 450, color: '#ffb199', fold: 0, rot: 0 },
                    { type: 1, x: 250, y: 450, color: '#0fd850', fold: 0, rot: 0 },
                    { type: 1, x: 350, y: 450, color: '#f9f047', fold: 0, rot: 0 }
                ]
            }
        ];