# Excalidraw classroom port — working plan

Agent-facing progress file. Update the checkboxes as work lands. Branch: `worktree-excalidraw-classroom`.

## Context (from discovery, 2026-06-10)

- Old whiteboard: bespoke react-konva in `frontend/src/components/InteractiveClassroom/Whiteboard{,.jsx,/}`, synced via `WhiteboardConsumer` (`backend/lessonbase/apps/core/consumers.py`) with per-process in-memory state + full-history snapshots. Known-broken: throttle drops events, reconnect loses onmessage, remote undo uses stale closures, absolute px coords (no normalization), text/select UX poor, arrow tool unimplemented.
- Decision: replace canvas with `@excalidraw/excalidraw` (MIT), keep Django Channels socket for sync, element-level reconciliation by `(version, versionNonce)` (Excalidraw elements are versioned for exactly this).
- Constraints: P2P-only WebRTC (single STUN on Hostinger host, no TURN/SFU). Screen share = extra track on same RTCPeerConnection → needs renegotiation (perfect-negotiation refactor of VideoChat). 1:1 classrooms only.
- Test access: login `lumi_teacher@example.com` / `password123` (dev), `POST {API}/classroom/practice/create/` → `/interactive-classroom/<access_token>`. No dashboard button anymore.
- Dev stack: docker `lessonbase-web-1` (backend, source mounted), Vite on :5173. BE tests: `MSYS_NO_PATHCONV=1 docker exec -w /app/lessonbase lessonbase-web-1 python manage.py test <apps> --noinput`. FE tests: `npx vitest run` from `frontend/`.
- Design tokens: `DESIGN.md` (Luminous; surface `#0b1326`, containers `#131b2e/#171f33/#222a3d`, primary `#9ccaff`, Manrope/Inter/JetBrains Mono).
- Frontend env: `VITE_REACT_APP_API_URL=http://localhost:8000`, WS `ws://localhost:8000/ws`. WS paths: `/ws/whiteboard/<token>/`, `/ws/webrtc/<token>/`, `/ws/chat/<token>/`, auth `?token=` query param.

## Sync protocol (new)

Client→server: `{type:"scene_update", payload:{elements:[changed elements incl. deleted]}}` — coalesced flush (~80ms), never dropped.
Server: reconciles into Redis-backed element map (key `whiteboard:scene:<room>`, TTL ~24h), broadcasts to group (sender excluded).
Server→client on connect: `{type:"scene_snapshot", payload:{elements:[...]}}`.
Reconcile rule both sides: keep element with higher `version`; tie → lower `versionNonce`. Deleted elements stay in map (`isDeleted:true`) so deletions propagate; pruned when whole scene dropped.
Pointer presence (optional, later): `{type:"pointer", payload:{x,y,username}}`, ephemeral, no storage.

## Steps

- [x] 1. Plan file + install `@excalidraw/excalidraw@0.18.1` (peer-deps OK with React 19; only radix sub-dep warnings)
- [x] 2. `ExcalidrawBoard.jsx` — uses package's own `reconcileElements` + `CaptureUpdateAction.NEVER` for remote applies; per-element `version:versionNonce` map for outgoing diff; 80ms coalesced flush; buffered remote payloads until API ready; files synced via `addFiles`
- [x] 3. Backend `WhiteboardConsumer` rewritten — `scene_update`/`scene_snapshot`/`pointer`/`request_snapshot`; Redis hashes `whiteboard:<room>:elements|files` via `redis.asyncio` (`REDIS_URL`), 24h TTL, 4MB/file cap; WebRTC consumer relay list extended with `description`/`media_state`/`screen_share`. Tests still to add (step 7).
- [x] 4. Luminous shell — new top bar (name, type chip, LIVE pill, resources, exit), board panel + 300px right rail (video 280px + chat), `panelSx` from tokens
- [x] 5. VideoChat — perfect negotiation (student = polite; pc only exists while peer present; `description` messages); `media_state` signalling (mic/cam badges); screen share both roles via extra MediaStream on same pc, announced with `screen_share {active, streamId}`; presentation lifted to shell via `onPresentation` (overlay over board, "Show whiteboard" toggle)
- [x] 6. `ClassroomResourceDrawer` — standalone library browser (GET /resources/), image → fetch → `getDataURL` → `addFiles` + `convertToExcalidrawElements` image element centred via `viewportCoordsToSceneCoords`; non-images open in new tab. Teacher-only button.
- [x] 7a. Deleted `Whiteboard.jsx`, `Whiteboard/`, `whiteboardSocket.js`; removed `konva`/`react-konva` deps
- [x] 7b. 4 new `WhiteboardSceneSyncTests` in apps/core/tests.py (auth, broadcast+snapshot, stale-version rejection). BE: 24/24 OK (docker /tmp/wt run). FE: vitest 112/112 OK.
- [x] 7c. Live two-tab verify on worktree stack: freehand + rect sync both ways instantly; move sync preserves the other tab's selection; full-page reload restores scene from Redis; pasted PNG (element + binary file) syncs to peer tab; resource drawer lists library, fileless resources guarded.

- De-branding: custom `<MainMenu>` (command palette, find, export image, reset, help) replaces the default menu's Excalidraw+/GitHub/socials links; library sidebar's "Browse libraries" link hidden via `.library-menu-browse-button { display:none }`. Remaining external links: only inside the Help dialog (keyboard-shortcut docs) — judged acceptable.
- HMR can transiently double-render the MainMenu trigger (tunnel-rat artifact); clean loads are fine.

## Outstanding / next session

- Resource-drawer insert untested with a REAL stored file (all seeded image resources are metadata-only, `file: null`). Test by uploading a real image first. If files live on R2 (`media.jkenny.tech`), browser fetch needs CORS headers on the bucket — likely needs a Cloudflare CORS rule before prod.
- Screen share + perfect negotiation verified by code/tests only — needs two real machines (or two Chrome profiles with separate cams) to e2e it. Same for media_state badges.
- Live cursors (pointer relay exists server-side; wire `collaborators` map client-side).
- Excalidraw asset/font loading in prod build: check whether `window.EXCALIDRAW_ASSET_PATH` should be set vs CDN default.
- Consider lazy-loading the Excalidraw chunk (it's large) via React.lazy for non-classroom routes.

## Verification stack (worktree, doesn't touch main dev stack)

- Backend: host run from `<worktree>/backend/lessonbase` using main checkout's venv `backend/.venv/Scripts/python.exe`, env: POSTGRES_{DB=kennysolutions_db,USER=kenny,PASSWORD=kenny,HOST=localhost,PORT=5432}, REDIS_URL=redis://localhost:6379, DEBUG=1, ENVIRONMENT=development + copy main's `backend/.env` → `manage.py runserver 8001` (channels/daphne serves WS through runserver).
- Frontend: from `<worktree>/frontend`: set `VITE_REACT_APP_API_URL=http://localhost:8001`, `VITE_REACT_APP_WEBSOCKET_URL=ws://localhost:8001/ws` as process env (overrides .env) → `npm run dev -- --port 5174`.
- BE tests against docker: `docker cp <worktree>/backend/lessonbase lessonbase-web-1:/tmp/wt/` then `docker exec -w /tmp/wt/lessonbase lessonbase-web-1 uv run python manage.py test apps.core --noinput`.

## Notes / gotchas discovered en route

- Excalidraw 0.18 is ESM-only; requires `import "@excalidraw/excalidraw/index.css"`. No Vite `define` shims needed (verify fonts load — package may fetch assets from CDN unless `window.EXCALIDRAW_ASSET_PATH` is set; check network tab in prod build).
- Excalidraw dark theme renders the canvas through an invert filter — don't set a custom `viewBackgroundColor` to match Luminous, it would display inverted. Default dark bg is close enough.
- Element `index` (fractional index) sorts lexicographically → server snapshot sorts by it for z-order.
- Pointer presence (live cursors via `collaborators` map) deliberately deferred; protocol already relays `pointer` events.
- Old protocol gone: any other client (e.g. mobile?) speaking draw_start/draw_update would break — none exists.
