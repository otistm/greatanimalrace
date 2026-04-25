# Playto Mini-Games Arcade Style Guide

This guide defines the unified "Arcade" aesthetic used across all HTML5 Canvas mini-games in the Playto universe. Adhering to these standards ensures a consistent retro arcade feel across all playable experiences.

## 1. Typography

**Primary Font:** `Press Start 2P`
- **Source:** Google Fonts
- **Fallback:** `monospace`
- **Usage:** Used globally for all text within the mini-game `iframe`.
- **Styling:** Text is generally uppercase to fit the retro arcade vibe.

```html
<style>
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    body {
        font-family: 'Press Start 2P', monospace;
    }
</style>
```

## 2. CRT & Screen Effects

The core arcade identity relies heavily on simulated CRT monitor effects. These classes should be applied to the main game container or as overlays.

### Scanlines
An overlay div that adds horizontal black/transparent stripes across the screen.

```css
.scanlines {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(
        to bottom,
        rgba(255,255,255,0),
        rgba(255,255,255,0) 50%,
        rgba(0,0,0,0.25) 50%,
        rgba(0,0,0,0.25)
    );
    background-size: 100% 4px;
    pointer-events: none; /* Crucial so clicks pass through to the game */
    z-index: 10;
}
```

### Screen Flicker
A subtle, rapid opacity change applied to the main game wrapper to simulate an old monitor.

```css
.crt-flicker {
    animation: flicker 0.15s infinite;
}

@keyframes flicker {
    0% { opacity: 0.95; }
    50% { opacity: 1; }
    100% { opacity: 0.95; }
}
```

## 3. UI Elements & Components

### Buttons
Arcade buttons should look like physical, chunky plastic buttons that can be pressed down.

- **Idle State:** Solid background, contrasting border (often white or dark variant of background), and a hard box shadow at the bottom (`box-shadow: 0 4px 0 #color`).
- **Active (Pressed) State:** Translates down on the Y-axis and reduces the box-shadow to 0 to simulate compression.

**Tailwind Example:**
```html
<button class="bg-blue-600 hover:bg-blue-500 text-white border-4 border-white px-6 py-4 rounded uppercase cursor-pointer shadow-[4px_4px_0_0_#fff] active:shadow-none active:translate-y-1 transition-all">
    Insert Coin
</button>
```

**Custom CSS Example:**
```css
.btn {
    background: #34495e;
    border: 3px solid #2c3e50;
    box-shadow: 0 4px 0 #1a252f;
    transition: transform 0.1s, box-shadow 0.1s;
}
.btn:active, .btn.active {
    transform: translateY(4px);
    box-shadow: 0 0px 0 #1a252f;
}
```

### Text Glow
Used for titles and important emphasis text to simulate neon or bright pixel emission. Colors should complement the game's primary theme.

```css
.text-glow {
    text-shadow: 2px 2px 0px #primary_color, -1px -1px 0px #secondary_color;
}
```

### The Star System
Used to display player progress and rating at the end of a level.

```css
.star { 
    color: #555; 
    text-shadow: 2px 2px 0 #000; 
}
.star.earned { 
    color: #f1c40f; 
    text-shadow: 2px 2px 0 #d35400; 
    animation: pop 0.3s ease-out; 
}

@keyframes pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.5); }
    100% { transform: scale(1); }
}
```

## 4. Layout & Containment

**Game Container:**
Games are displayed in a centered, fixed-aspect-ratio (or max-width) container to ensure the layout doesn't break on ultra-wide screens.

```css
#game-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    max-width: 600px;
    margin: 0 auto;
    overflow: hidden;
    /* Soft ambient glow matching the game's theme */
    box-shadow: 0 0 30px rgba(theme_r, theme_g, theme_b, 0.15); 
}
```

**Canvas:**
Always use `image-rendering: pixelated;` on the `<canvas>` element to ensure retro pixel art and text drawn to the canvas remain sharp and not blurry/anti-aliased.

```css
canvas {
    display: block;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
}
```

## 5. Overlay Screens

Screens like "Insert Coin" (Start), "Game Over", and "Level Complete" should overlay the entire game container.

- **Styling:** Use semi-transparent dark backgrounds (e.g., Tailwind `bg-black/80`, `bg-red-900/90`, `bg-green-900/90`).
- **Structure:** Centered flexbox content (`flex flex-col items-center justify-center`).
- **Pointer Events:** The overlay wrapper should often have `pointer-events-none` so it doesn't block underlying touches if it's purely visual HUD, but actual interactive screens (Start/Game Over) should use `pointer-events-auto` on clickable elements.

**Example Structure:**
```html
<div id="start-screen" class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30">
    <h1 class="text-4xl text-white mb-6 text-glow leading-loose">GAME TITLE</h1>
    <button class="...">Insert Coin</button>
</div>
```

## 6. Mobile Considerations

- Prevent mobile text selection and default touch behaviors globally on the `body`:
```css
body {
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
}
```
- Ensure HUD elements that overlay the game canvas have `pointer-events: none;` to allow touch events to pass through to the game logic underneath.