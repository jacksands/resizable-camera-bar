# Resizable Camera Bar — Instructions

A module for **Foundry VTT v13 and v14** that lets you freely resize the camera bar and, optionally, lay the cameras out in a multi-row or multi-column grid.

The resize handle sits on the **inner edge** of the bar, between the bar and the canvas. An 👁 eye icon, a ⚠ warning icon (when cameras are hidden) and a ▦ grid toggle icon appear at the outer corner.

---

## How to Use

- **Hover** over the inner edge of the bar to reveal the resize handle
- **Drag** the handle to resize the bar
- **Double-click** the handle to reset to the default size
- Size is **saved per client** and restored on reload
- Click the 👁 icon to jump directly to Module Settings
- Click the ▦ icon to turn the Grid Layout on or off (see below)

The icons live at the outer corner of the camera bar and are always visible and never covered by other UI elements. They stack in this order: 👁, ⚠ (only when someone is hidden), ▦. When ⚠ is not shown, ▦ moves up to sit right under 👁.

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

**Grid Options: Horizontal Bar (top / bottom)**

- **Horizontal Grid: Enable**: Turns the grid on for top/bottom bars (default: off). Same as the ▦ icon.
- **Max Frame Height (px)**: Frames never exceed this height; taller bars get extra rows (default: 150)
- **Auto-Wrap Rows**: Ignores the max height and adds a row only when frames no longer fit (default: off)

**Grid Options: Vertical Bar (left / right)**

- **Vertical Grid: Enable**: Turns the grid on for left/right bars (default: off). Same as the ▦ icon.
- **Max Frame Width (px)**: Frames never exceed this width; wider bars get extra columns (default: 170)
- **Auto-Wrap Columns**: Ignores the max width and adds a column only when frames no longer fit (default: off)

Grid changes apply immediately, with no reload.

---

## Grid Layout

By default the bar shows cameras in a single row (top/bottom) or a single column (left/right). The Grid Layout spreads them over several rows or columns, which saves space when many players have their camera on. It is **off by default**; with it off, the bar behaves exactly as before.

### Turning it on

- Click the ▦ icon in the bar's icon stack. It switches the grid for the bar's **current orientation**: horizontal if the bar is at the top/bottom, vertical if it is at the left/right.
- Or use the **Enable** checkboxes in Module Settings, under *Grid Options*.
- The icon is bright (with a soft glow) when the grid is on for this orientation and dim when it is off.
- The two toggles are **independent**: you can use the grid on horizontal bars only, on vertical bars only, or both. The state is saved per user.

### How the grid is calculated

- **Max Frame Height** (horizontal) / **Max Frame Width** (vertical): the biggest a frame is allowed to get. When the bar is taller (horizontal) or wider (vertical) than this, extra rows/columns are added to use the space. Frames are spread evenly, so 4 frames in 2 rows are laid out 2 + 2.
- **Auto-Wrap**: ignores the max size. Frames stay as large as possible in a single row/column, and a new row/column is added only when they no longer fit. While Auto-Wrap is on, the *Max Frame* value has no effect.
- Frames follow the **Aspect Ratio** setting and never go below **Minimum Size**. If there are so many cameras that they cannot all fit at the minimum size, the bar scrolls instead of cutting frames off.
- Placement: the vertical grid is centered in the bar; the horizontal grid is centered horizontally and aligned to the top.
- The layout is recalculated live when you resize the bar, when players join or leave, when cameras are hidden or shown (including *Hide Cameras Without Video*), and when you change the dock position.
- Turning the grid off returns to the original single row/column behavior.

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

