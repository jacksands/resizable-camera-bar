# 📷 Resizable Camera – Version 3.1 - verified and adapted for Foundry V14.

![](https://komarev.com/ghpvc/?username=Jack_Sands&color=green&style=flat-square)


<img width="490" height="925" alt="screenshot-logo" src="https://github.com/user-attachments/assets/bf89ae94-98fd-4c37-93b5-18b7c3a52d24" />

**New in 3.1: Grid Layout.** Show the cameras in multiple rows or columns instead of a single one. See [Grid Layout](#-grid-layout-new-in-31) below.

Version 2.0 of **Resizable Camera** introduces improved resizing behavior and several new customization options.

You can now drag and resize the camera bar using a handle located at the center of the bar. The handle always remains centered, regardless of where the bar is positioned on the screen.

---

## 🔧 Resize Behavior

To prevent resizing issues that could make the camera bar excessively large or small:

- The size is capped by the **max-width** and **max-height** values defined in the module settings.
- Limits depend on vertical or horizontal position.
- The bar will **never be smaller than 40px**, preventing it from disappearing.

All **dragged sizes are saved in memory**.

- Settings are stored **per client**.
- Settings are stored **per bar position**.
- Thanks to **dineshm72** for requesting this feature.
<img width="330" height="192" alt="screenshot-handle-left" src="https://github.com/user-attachments/assets/e9a32a01-1e24-44ed-add0-8559cae37d5d" />

---

## 💬 Chat Behavior Adjustment

Chat buttons will now wrap below the chat input field when the right bar is collapsed.

This change was made for **accessibility and ease of use**.
<img width="509" height="263" alt="screenshot-handle-top" src="https://github.com/user-attachments/assets/5958de20-ebee-4189-8129-f738ca1ae178" />
<img width="435" height="233" alt="screenshot-handle-bottom" src="https://github.com/user-attachments/assets/8d8ca7ee-2182-4508-8940-dfb2d3a6d298" />
---

## ⚙ Configuration

<img width="810" height="822" alt="screenshot-settings" src="https://github.com/user-attachments/assets/7f8f40cd-cd49-4808-8402-89b0017223d6" />



All settings include **default values**.

You can:

1. Install the module.
2. Activate it in your world.
3. Start using it immediately.

A new icon in the camera bar provides **quick access to module settings**.

The camera bar also has a **grid icon** to toggle the Grid Layout (see below).

---

# 🆕 New Options in Version 2.0

All new options are set to **Foundry’s default behavior** or the simplest configuration by default to prevent unexpected behavior.

---

## 🎥 Camera Aspect Ratio

Some video platforms support widescreen or alternative aspect ratios.

These are now configurable in the settings.

**Important:**

- Proper display depends on the transmitted video feed using the correct ratio.
- Selecting the wrong ratio may cause cropping.

---

## 👁 Hide Cameras Without Video

<img width="517" height="629" alt="Screenshot_8" src="https://github.com/user-attachments/assets/44b8dfe9-712c-4dc8-90ef-d2e42bf91e22" />


This was the **most complex feature implemented so far**.

### Default Foundry Behavior

When a user is connected but not transmitting video, their camera frame remains visible.

### New Behavior

This feature automatically:

- Detects whether a user is transmitting video.
- Hides their camera if they are not.
- Restores the camera automatically if transmission resumes.

A **(!)** icon appears when one or more cameras are hidden.

Hover over it to see how many are currently hidden.

### Important Notes

- Your own camera will also be hidden if you are not transmitting.
- You can control transmission using camera bar settings.
- You can disable this behavior in module settings.
- When using this feature for the first time, verify that no one is unintentionally hidden, as it has been difficult to implement.
- Thanks to [brunocalado](https://github.com/brunocalado)  for the help solving some unwanted behavior in the hide camera feature!

---

## 🧲 Handle Always Visible

Makes the resize handle permanently visible instead of appearing only on mouse hover.

---

## 🎨 Color

Changes the color of:

- Icons
- Resize handle

---

## 🌫 Opacity

Adjusts the opacity of the resize handle only.

---

## ▦ Grid Layout (new in 3.1)

By default the bar shows cameras in a single row (top/bottom) or a single column (left/right). With many players, that wastes space. The Grid Layout spreads the cameras over several rows or columns.

It is **off by default**. With it off, the bar behaves exactly as before.

### Turning it on

- Click the new **▦ icon** in the bar's icon stack (under the 👁 eye and ⚠ warning icons). It toggles the grid for the bar's **current orientation**: horizontal at the top/bottom, vertical at the left/right.
- Or use the **Enable** checkboxes in Module Settings, under *Grid Options*.
- The icon is bright (with a soft glow) when the grid is on and dim when it is off.
- The horizontal and vertical toggles are **independent**, and the state is saved **per user**.

### Settings (Grid Options)

| Group | Setting | Default | What it does |
|---|---|---|---|
| Horizontal (top/bottom) | Enable | off | Turns the grid on for horizontal bars |
| | Max Frame Height (px) | 150 | Frames never exceed this height; a taller bar gets extra rows |
| | Auto-Wrap Rows | off | Ignores the max height and adds a row only when frames no longer fit |
| Vertical (left/right) | Enable | off | Turns the grid on for vertical bars |
| | Max Frame Width (px) | 170 | Frames never exceed this width; a wider bar gets extra columns |
| | Auto-Wrap Columns | off | Ignores the max width and adds a column only when frames no longer fit |

### How it behaves

- Frames are spread evenly: 4 frames in 2 rows are laid out 2 + 2.
- **Auto-Wrap** keeps frames as large as possible and adds a row/column only when needed. While it is on, the *Max Frame* value has no effect.
- The layout is recalculated live when you resize the bar, when players join or leave, when cameras are hidden or shown, and when you change the dock position.
- Frames follow the **Camera Aspect Ratio** setting and never go below **Minimum Size**. If there are too many cameras for that, the bar scrolls instead of cutting frames off.
- The vertical grid is centered in the bar; the horizontal grid is centered horizontally and aligned to the top.
- Changes apply immediately, with no reload.

---

## 🔄 Reload Pop-up

Most features do not require a reload when settings change.

However, some options do.

When changing settings:

- A small pop-up will ask whether you want to refresh.
- It will attempt to inform you if reload is required.

If your new settings do not appear to apply:

- Refresh the page.
- Otherwise cancel if unnecessary.

---

## 🛠 Small (and Slightly Embarrassing) Tip

On rare occasions, the camera frame may disappear or freeze.

The exact cause has not been identified and the issue is uncommon.

If it happens:

1. Change the bar position.
2. Or refresh the page.
3. Then switch back to your preferred position.

This has consistently resolved the issue.


# **License**

legal code: https://creativecommons.org/licenses/by-nc/4.0/
