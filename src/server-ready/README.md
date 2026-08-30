# Server-ready boundary

The current build remains local-first so it can be played immediately in a browser.
`src/platform/storageBridge.js` emulates the old `window.storage` API using LocalStorage.

When multiplayer work starts, replace persistence and battle authority behind service modules instead of rewriting screens.
Planned boundaries:
- authentication/session service
- character repository
- inventory/economy repository
- authoritative battle service
- matchmaking/WebSocket client

Do not move authoritative damage, drops, currency, XP or PvP outcomes into client-trusted APIs.
