# Resizable Camera Bar

![Resizable Camera Bar Logo](images/screenshot-logo.png)

A **Foundry VTT v13** module that provides intuitive resizing controls for the camera bar with extensive customization options.

Version 2.0+ introduces improved resizing behavior, automatic camera hiding, real-time visual feedback, and full native compatibility with Foundry's dock minimize feature.

---

## Features

### 🎯 Intuitive Resize Handle

The resize handle is positioned on the **inner edge** of the camera bar — the side facing the canvas. The handle location automatically adjusts based on bar position:

| ![Left Bar](images/screenshot-handle-left.png) | ![Top Bar](images/screenshot-handle-top.png) | ![Bottom Bar](images/screenshot-handle-bottom.png) |
|:---:|:---:|:---:|
| Left bar → right edge | Top bar → bottom edge | Bottom bar → top edge |

**Key Features:**
- Handle appears on hover (or always visible via setting)
- Thin 4px visual, 60% bar length — easy to find
- Double-click to reset to default size
- Per-client saved sizes (restore on reload)
- Respects configured min/max bounds

---

### 👁 Quick Settings Access

An eye icon appears at the outer corner of the camera bar, providing instant access to module settings. Always visible and never covered by other UI elements.

When **Hide Cameras Without Video** is enabled, a ⚠ warning icon appears below the eye icon whenever cameras are hidden. Hover to see the count of hidden cameras.

---

### 📹 Hide Cameras Without Video

**Automatically hides** camera slots for users who are connected but not transmitting video. Reacts in real time — no reload needed.

**How it works:**
- User joins with camera off → slot hidden immediately
- User turns camera on mid-session → slot reappears instantly
- User turns camera off → slot hidden
- Warning icon ⚠ shows count of hidden cameras on hover

**Important notes:**
- Your own camera slot will also be hidden if you're not transmitting
- Uses `visibility:hidden` to keep layout stable — cameras don't shift position when hidden
- Detection uses multiple signals: `no-video` class, `video[hidden]` attribute, `srcObject` state, and video track status

---

### 🎨 Extensive Customization

![Settings Panel](images/screenshot-settings.png)

**Size Controls:**
- Maximum Width (vertical bars): 100–1000px
- Maximum Height (horizontal bars): 60–800px  
- Minimum Size: 40–200px

**Visual Options:**
- Aspect Ratio: 4:3 (default), 16:9 (widescreen), or Free
- Handle & Icon Color: Hex field + color picker
- Handle Opacity: 0.1–1.0
- Handle Always Visible toggle

![Aspect Ratio Settings](images/screenshot-aspect-ratio.png)

---

## Installation

### Method 1: Manifest URL (Recommended)

```
https://raw.githubusercontent.com/jacksands/resizable-camera-bar/refs/heads/main/module.json
```

1. In Foundry, go to **Add-on Modules**
2. Click **Install Module**
3. Paste the manifest URL
4. Click **Install**

### Method 2: Module Browser

Search for "Resizable Camera Bar" in Foundry's built-in module browser.

---

## Usage

1. **Enable the module** in your world
2. The resize handle will appear on the inner edge of your camera bar
3. **Hover** to reveal the handle, then **drag** to resize
4. Click the 👁 **eye icon** in the camera bar to access settings
5. Configure options to your preference

### First-Time Setup

All settings have sensible defaults — the module works immediately after activation. The eye icon provides quick access to customization.

### Reload Prompt

Most setting changes apply immediately. When a reload is beneficial, a dialog will appear with options to:
- **Reload Now** — refresh the page to apply all changes
- **Continue Without Reloading** (default) — keep working

---

## Compatibility

- **Foundry VTT:** v13+
- **API:** Uses ApplicationV2, DialogV2, and fully-namespaced SettingsConfig
- **Native Dock:** Full compatibility with Foundry's minimize feature
- **AV Systems:** Works with Foundry's native AV and LiveKit

---

## Technical Details

### Architecture

- **Handle positioning:** `position:fixed` with `getBoundingClientRect()` — works regardless of Foundry's layout context
- **Settings storage:** JSON serialization for complex data (Foundry limitation workaround)
- **Camera detection:** Multi-signal approach — `no-video` class, `video[hidden]`, `srcObject`, and track state
- **Real-time updates:** `MutationObserver` with `subtree:true` + video element event listeners
- **Minimize compatibility:** `MutationObserver` on `.minimized` class calls `clearInlineSize()` to cooperate with Foundry's CSS

### Performance

- Debounced storage writes (400ms)
- Smooth drag via `requestAnimationFrame`
- Observer cleanup on bar removal via `WeakMap` tracking

---

## Changelog

### v2.0.0 — Initial Release

**Core Features:**
- Custom drag handle on inner edge (position adapts to bar location)
- Thin 4px handle, 60% bar length — easy to find when invisible
- Double-click handle to reset to default size
- Per-client size persistence (saved per bar position)
- Full compatibility with Foundry native dock minimize

**Visual Elements:**
- Eye icon (👁) at outer corner — always visible, never covered
- Warning icon (⚠) appears when cameras are hidden with hover tooltip
- Handle appears on hover (or always visible via setting)
- Color picker: hex input + native color swatch side-by-side

**Hide Cameras Without Video:**
- Automatically hides slots of users not transmitting video
- Multi-signal detection: `srcObject`, track state, `no-video` class, `hidden` attribute
- Real-time updates via `MutationObserver` + video event listeners
- Works for users who join mid-session without camera
- Includes own slot — if not transmitting, hidden for consistency

**Settings:**
- Maximum Width/Height with configurable ranges
- Minimum Size protection (prevents bar from disappearing)
- Aspect Ratio: 4:3 (default), 16:9 (widescreen), or Free
- Handle customization: color, opacity, always visible toggle
- Instructions accessible via Module Settings (INSTRUCTIONS.md)

**Technical:**
- ApplicationV2 / DialogV2 / fully-namespaced SettingsConfig — no deprecation warnings
- `position:fixed` positioning via `getBoundingClientRect()`
- JSON serialization for complex settings
- Observer cleanup via `WeakMap` tracking

---

## Credits

- **Author:** Jack_Sands
- **Special Thanks:** dineshm72 for requesting size persistence feature

---

## License

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)

---

## Support

For issues, feature requests, or questions:
- GitHub Issues: [github.com/jacksands/resizable-camera-bar/issues](https://github.com/jacksands/resizable-camera-bar/issues)
- Foundry Discord: Find me in the #module-development channel

---

## Screenshots

The module adapts to all camera bar positions and works seamlessly with Foundry v13's native interface.
