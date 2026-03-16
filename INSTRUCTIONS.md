# Resizable Camera Bar — Instructions

A module for **Foundry VTT v13** that lets you freely resize the camera bar.

The resize handle sits on the **inner edge** of the bar — between the bar and the canvas. An 👁 eye icon and ⚠ warning icon (when cameras are hidden) appear at the outer corner.

---

## How to Use

- **Hover** over the inner edge of the bar to reveal the resize handle
- **Drag** the handle to resize the bar
- **Double-click** the handle to reset to the default size
- Size is **saved per client** and restored on reload
- Click the 👁 icon to jump directly to Module Settings

The eye icon lives at the outer corner of the camera bar and is always visible — never covered by other UI elements.

---

## Handle Location by Bar Position

| Bar Position | Handle Location |
|---|---|
| Left | Right edge (facing canvas) |
| Right | Left edge (facing canvas) |
| Top | Bottom edge (facing canvas) |
| Bottom | Top edge (facing canvas) |

---

## Available Settings

All settings are **per user** (each player keeps their own preferences, synchronized across devices).

**Maximum Width** — Width cap in pixels for left/right bars (default: 500)

**Maximum Height** — Height cap in pixels for top/bottom bars (default: 400)

**Minimum Size** — Prevents the bar from shrinking too small (default: 80)

**Aspect Ratio** — 4:3, 16:9 (crops unless source is native 16:9), or Free (default: 4:3)

**Hide Cameras Without Video** — Automatically hides slots of users who are connected but not transmitting video. Reacts in real time — no reload needed. (default: off)

**Handle Always Visible** — Show the handle without hovering (default: off)

**Handle & Icon Color** — Hex code field + color swatch — edit the code or click the swatch to open the system color picker (default: #c8a060 amber)

**Handle Opacity** — Opacity when visible, 0.1–1.0 (default: 0.7)

---

## The ⚠ Warning Icon

The warning icon appears whenever one or more camera slots are hidden — either automatically by this module or manually by the GM.

**Hover over the ⚠ icon** to see a panel listing exactly who is hidden and why:

- **Hidden by module** — users whose camera is off and were automatically hidden because *Hide Cameras Without Video* is enabled
- **Hidden manually** — users hidden by the GM using Foundry's built-in Hide User option

The icon appears even when *Hide Cameras Without Video* is turned off, if there are users hidden manually — so the GM is always aware of hidden slots regardless of module settings.

### How to show a manually hidden user

Manual hiding is a feature built into Foundry, not this module. To show a user who was hidden manually:

1. Open the **Players list** at the bottom-left of the screen
2. **Right-click** the player's name
3. Click **Show User**

This is independent of the *Hide Cameras Without Video* setting in this module.

---

## Notes

- **16:9 aspect ratio** may crop images if your webcam does not natively stream in widescreen
- **Hide Cameras Without Video** includes your own slot — if you are not transmitting, your camera will be hidden too
- Settings changes apply immediately in most cases; a reload prompt appears only when necessary

