# Changelog — Resizable Camera Bar

---

## v2.1.0 — 2026-03-17

### [Changed]
- Moved `resizable.js` to `scripts/` and split into 9 ES modules: `constants.js`, `settings.js`, `readme.js`, `bar-utils.js`, `handle.js`, `icons.js`, `camera-visibility.js`, `bar-init.js`, `hooks.js`, with `main.js` as entry point.
- Moved `resizable.css` to `styles/resizable.css`.
- Updated `module.json` `esmodules` and `styles` paths to reflect new locations.

### [Fixed]
- `initBar` retry loop now caps at 20 attempts (3 s) instead of retrying indefinitely when the position class never appears.
- Removed fragile `setTimeout` cascades for video detection in `initBar` and `userConnected`; video stream readiness is now fully event-driven via `attachVideoListeners`.
- Replaced `setInterval` polling for color picker injection with a `MutationObserver` that reacts instantly when the settings tab section renders.

### [Changed]
- Replaced ad-hoc DOM node property flags (`_rcbListened`, `_rcbPickerInjected`, `_rcbChangeListened`) with `WeakSet` instances for cleaner, garbage-collection-friendly duplicate-guard tracking.

---

## v2.0.6 — 2026-03-16

Full API audit and hardening pass. All changes are backwards-compatible — no settings migration required.

### Bug fixes

- **`initBar` observer leak** — `cleanupObservers` was called *after* creating new observers and DOM elements, meaning every second call to `initBar` (e.g. closing Settings then reopening) stacked a duplicate set of observers running in parallel. Moved cleanup to the top of `initBar`, before any new resources are allocated.
- **Duplicate `MutationObserver` storage** — the two internal observers (`moClass` and `moVideo`) were stored with an intermediate overwrite pattern that was fragile and hard to follow. Both are now created, then stored together in a single wrapper with a unified `disconnect()`.
- **`MutationObserver` feedback loop** — `moVideo` observed `class` changes on the entire subtree, including the `rcb-dynamic-hide` class it was responsible for adding. This caused `applyNoVideoVisibility` to fire 5+ times per second in a cascade. Fixed by adding `attributeOldValue: true` and filtering out mutations where the only change was our own class.
- **`RCBReadmeMenu` crash on click** — The settings menu `type` class went through three broken iterations: plain class (rejected by `registerMenu` instanceof check, crashing the entire `init` hook and preventing all settings from registering), then `ApplicationV2` without stubs (crash: `_replaceHTML` not implemented), then `HandlebarsApplicationMixin` with `template: null` (crash: `Cannot read properties of null (reading 'startsWith')`). Final solution: `ApplicationV2` with minimal `_renderHTML` and `_replaceHTML` stubs, using `_onRender` to close the empty window and open the `DialogV2` README.
- **`render(true)` wrong API** — `SettingsConfig().render(true)` used the ApplicationV1 signature. Corrected to `render({ force: true })` per ApplicationV2 API.
- **`renderCameraViews` global fallback** — the hook handler fell back to `document.querySelector("#camera-views")` if the received `html` element didn't match, ignoring the hook's own argument and potentially initialising the wrong bar. Now uses only the element received by the hook.
- **jQuery dead code** — `html instanceof jQuery` checks remained in `renderSettingsConfig` and `renderCameraViews` despite the module requiring Foundry v13 minimum, where ApplicationV2 always passes plain `HTMLElement`. Removed.
- **Warning icon: manually hidden users not detected** — `game.webrtc.settings.getUser().hidden` was used to detect users hidden via the GM context menu ("Hide User"). This flag actually reflects the user's own AV settings state, not the GM action. When a user is manually hidden, Foundry removes their camera slot from the DOM entirely — there is no slot to query. Fixed with DOM-based inference: a connected user (`user.active`) with no `camera-view[data-user]` slot in the bar is considered manually hidden.
- **CSS scope leak** — `#chat-notifications #chat-controls` and `.split-button.vertical` were global selectors that affected the entire Foundry UI. Scoped to `#camera-views` context.

### Improvements

- **`savedSizes` setting** — changed from `type: String` with manual `JSON.parse/stringify` to `type: Object`, letting Foundry handle serialisation internally. More robust against localStorage corruption.
- **Settings scope** — all user preference settings (`maxWidth`, `maxHeight`, `minSize`, `aspectRatio`, `hideNoVideo`, `handleAlwaysVisible`, `handleColor`, `handleOpacity`) changed from `scope: "client"` (localStorage, browser-only) to `scope: "user"` (User document, syncs across devices). `savedSizes` intentionally remains `client` — it is written on every animation frame during drag and a server round-trip per frame would be unacceptable.
- **`userConnected` hook** — added `if (!connected) return` guard. When a user disconnects Foundry removes their slot automatically; running `applyNoVideoVisibility` three times with escalating timeouts on disconnect was unnecessary work.
- **`module.json` compatibility** — added `"maximum": "13"` to prevent the module from appearing compatible with future Foundry versions where the API may differ.

### New features

- **Warning icon tooltip** — replaced the native `title` attribute (small, uncontrollable) with a custom `position: fixed` HTML panel. Shows on hover, disappears on mouse leave. Font 13px, fixed width 220px, themed to match the module.
- **Two hidden categories in tooltip** — the warning panel now distinguishes between cameras hidden by the module (no video stream detected) and cameras hidden manually by the GM ("Hide User" in the player list context menu). Each category is listed separately with player names.
- **Warning icon visible without "Hide Cameras" setting** — the ⚠ icon now appears even when *Hide Cameras Without Video* is disabled, if there are users hidden manually by the GM. This ensures the GM is always aware of hidden slots regardless of module settings.
- **README dialog: resizable and scrollable** — the README dialog now opens larger (560×520), supports window resize, and the content area recalculates its height dynamically using `ResizeObserver` so the scrollbar always fills the available space correctly (same pattern as `learn-002`).
- **README dialog: larger font** — increased from 13px to 14px with more generous padding and spacing for readability.

---

## v2.0.5 — 2025-02-23

### Bug fix

- Removed `game.webrtc.settings.setUser()` call from the `ready` hook. This API does not exist in all Foundry v13 builds, causing a `TypeError` on startup. The cleanup it performed (resetting hidden state from previous sessions) is unnecessary because the CSS approach works independently of any persisted state.

---

## v2.0.4 — 2025-02-23

### Architecture change

Replaced the native API approach to hide/show with a hybrid strategy:

- **Init only:** API call to clear any persisted hidden state from previous sessions (one-time, on `ready`)
- **Runtime:** CSS class `rcb-dynamic-hide` (`display: none`) instead of `game.webrtc.settings.setUser()`

**Why:** `setUser()` destroys the DOM node entirely, removing the `<video>` element and all attached event listeners. Once the node is gone there is no way to detect when the stream resumes. The CSS approach preserves the node in memory — event listeners survive and react instantly when video starts.

Result: latency under 100ms, no loops, no state bugs.

---

## v2.0.3 — 2025-02-23

### Bug fix

Users with their camera disabled remained hidden after a page refresh.

**Cause:** `applyNoVideoVisibility` only iterated over slots present in the DOM. If a slot had been destroyed by a previous API call it was never re-evaluated.

**Fix:** iterate `game.users` instead of DOM slots, so every connected user is checked regardless of whether their slot currently exists.

---

## v2.0.0 → v2.0.2 — 2025-02-23

Initial release. Core features:

- Drag handle on the inner edge of the camera bar to resize
- Double-click handle to reset to default size
- Size saved per client (localStorage), restored on reload
- Handle position adapts to bar docking position (left / right / top / bottom)
- Eye icon (👁) opens Module Settings directly
- Settings: max width, max height, min size, aspect ratio (4:3 / 16:9 / free), handle always visible, handle color, handle opacity
- Hide Cameras Without Video: hides slots of connected users not transmitting video, reacts in real time via `<video>` DOM events and `MutationObserver`
- Warning icon (⚠) appears when cameras are hidden
