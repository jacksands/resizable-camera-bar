# Resizable Camera Bar

<img width="490" height="925" alt="Screenshot_3" src="https://github.com/user-attachments/assets/fd4dca2a-3340-42d5-9976-1f91f6b7c632" />


A simple module for **Foundry VTT v13** that lets you freely resize the camera bar.

The resize handle sits on the **inner edge** of the bar — between the bar and the canvas. An 👁 eye icon lives inside the bar's own controls area and opens Module Settings directly.

| Bar position | Handle location |
|---|---|
| Left | Right edge (facing canvas) |
| Right | Left edge (facing canvas) |
| Top | Bottom edge (facing canvas) |
| Bottom | Top edge (facing canvas) |

---

## How to use

- **Hover** over the inner edge of the bar to reveal the resize handle.
- **Drag** the handle to resize the bar.
- **Double-click** the handle to reset to the default size.
- Size is **saved per client** and restored on reload.
- Click the 👁 icon in the camera bar controls to jump directly to Module Settings.

The eye icon lives inside Foundry's own `.user-controls` area of the camera bar, so it is always visible and never covered by other UI elements.

---

## Settings
<img width="810" height="822" alt="Screenshot_7" src="https://github.com/user-attachments/assets/ebe6eb2c-8707-460a-aee6-ee20455922e2" />



All settings are **per client** (each player keeps their own preferences).

| Setting | Description | Default |
|---|---|---|
| Show README on Startup | Re-enable the first-run popup | On |
| Maximum Width | Width cap in px for left/right bars | 500 |
| Maximum Height | Height cap in px for top/bottom bars | 400 |
| Minimum Size | Prevents the bar from shrinking too small | 80 |
| Aspect Ratio | 4:3, 16:9 (crops unless source is native 16:9), or Free | 4:3 |
| Handle Always Visible | Show the handle without hovering | Off |
| Handle Color | Hex color for handle and eye icon | #c8a060 |
| Handle Opacity | Opacity when visible (0.1–1.0) | 0.7 |

---

## Installation

```
https://raw.githubusercontent.com/jacksands/resizable-camera-bar/refs/heads/main/module.json
```

---

## License

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)
