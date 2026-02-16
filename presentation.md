# 📷 Resizable Camera – Version 2.0

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

---

## 💬 Chat Behavior Adjustment

Chat buttons will now wrap below the chat input field when the right bar is collapsed.

This change was made for **accessibility and ease of use**.

---

## ⚙ Default Configuration

All settings include **default values**.

You can:

1. Install the module.
2. Activate it in your world.
3. Start using it immediately.

A new icon in the camera bar provides **quick access to module settings**.

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
- When using this feature for the first time, verify that no one is unintentionally hidden.

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
