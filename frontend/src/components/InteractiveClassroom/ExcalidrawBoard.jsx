import { useCallback, useEffect, useRef } from "react";
import { Box } from "@mui/material";
import {
  Excalidraw,
  MainMenu,
  CaptureUpdateAction,
  reconcileElements,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

import ClassroomBoardSocket from "../../services/classroomBoardSocket";
import { lumi } from "../luminous";

// How long local edits are batched before a sync flush. Edits are coalesced,
// never dropped: anything still pending goes out on the next flush.
const FLUSH_INTERVAL_MS = 80;

const versionKey = (el) => `${el.version}:${el.versionNonce}`;

/**
 * Collaborative Excalidraw canvas for the interactive classroom.
 *
 * Sync model: every element carries (version, versionNonce). We keep a map of
 * the last version we've synced per element id; onChange diffs the live scene
 * against it and ships only changed elements. Remote updates are merged with
 * Excalidraw's own reconcileElements and applied with captureUpdate NEVER so
 * they don't pollute the local undo stack. The server snapshots the scene to
 * every (re)connection, so reconnects self-heal.
 */
const ExcalidrawBoard = ({ roomId, onApiReady, onConnectionChange }) => {
  const apiRef = useRef(null);
  const socketRef = useRef(null);
  const syncedVersions = useRef(new Map()); // element id -> "version:nonce"
  const syncedFileIds = useRef(new Set());
  const flushTimer = useRef(null);
  const bufferedRemote = useRef([]); // payloads that arrived before the API was ready

  const applyRemotePayload = useCallback((payload) => {
    const api = apiRef.current;
    if (!api) {
      bufferedRemote.current.push(payload);
      return;
    }

    const remoteElements = payload?.elements || [];
    const remoteFiles = payload?.files || {};

    const fileList = Object.entries(remoteFiles).map(([id, file]) => ({ ...file, id }));
    if (fileList.length) {
      fileList.forEach((f) => syncedFileIds.current.add(f.id));
      api.addFiles(fileList);
    }

    if (!remoteElements.length) return;
    remoteElements.forEach((el) => syncedVersions.current.set(el.id, versionKey(el)));

    const reconciled = reconcileElements(
      api.getSceneElementsIncludingDeleted(),
      remoteElements,
      api.getAppState()
    );
    api.updateScene({
      elements: reconciled,
      captureUpdate: CaptureUpdateAction.NEVER,
    });
  }, []);

  const flushPending = useCallback(() => {
    flushTimer.current = null;
    const api = apiRef.current;
    const socket = socketRef.current;
    if (!api || !socket) return;

    const changed = [];
    for (const el of api.getSceneElementsIncludingDeleted()) {
      if (syncedVersions.current.get(el.id) !== versionKey(el)) changed.push(el);
    }

    const newFiles = {};
    for (const [id, file] of Object.entries(api.getFiles())) {
      if (!syncedFileIds.current.has(id)) newFiles[id] = file;
    }

    if (!changed.length && !Object.keys(newFiles).length) return;

    const sent = socket.send("scene_update", { elements: changed, files: newFiles });
    if (sent) {
      changed.forEach((el) => syncedVersions.current.set(el.id, versionKey(el)));
      Object.keys(newFiles).forEach((id) => syncedFileIds.current.add(id));
    }
    // If the socket was closed the diff stays pending; the reconnect's onOpen
    // flush picks it up, and the server snapshot covers anything we missed.
  }, []);

  const scheduleFlush = useCallback(() => {
    if (!flushTimer.current) {
      flushTimer.current = setTimeout(flushPending, FLUSH_INTERVAL_MS);
    }
  }, [flushPending]);

  const handleApi = useCallback(
    (api) => {
      apiRef.current = api;
      bufferedRemote.current.splice(0).forEach(applyRemotePayload);
      onApiReady?.(api);
    },
    [applyRemotePayload, onApiReady]
  );

  useEffect(() => {
    const socket = new ClassroomBoardSocket(roomId);
    socketRef.current = socket;

    socket.on("scene_snapshot", applyRemotePayload);
    socket.on("scene_update", applyRemotePayload);
    socket.onOpen(() => {
      onConnectionChange?.(true);
      flushPending();
    });
    socket.onClose(() => onConnectionChange?.(false));

    return () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  return (
    <Box
      className="classroom-board"
      sx={{
        height: "100%",
        width: "100%",
        // Luminous accents inside Excalidraw's dark theme.
        "& .excalidraw": {
          "--color-primary": lumi.color.primaryContainer,
          "--color-primary-darker": "#1d8ae6",
          "--color-primary-darkest": "#0f6fc2",
          "--color-primary-light": "rgba(49, 164, 255, 0.25)",
          fontFamily: lumi.font.body,
        },
        // The library sidebar's "Browse libraries" button links out to
        // libraries.excalidraw.com — keep the classroom unbranded.
        "& .library-menu-browse-button": { display: "none" },
      }}
    >
      <Excalidraw
        excalidrawAPI={handleApi}
        onChange={scheduleFlush}
        theme="dark"
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            toggleTheme: false,
          },
        }}
      >
        {/* Custom menu: useful actions only, no Excalidraw+/socials links. */}
        <MainMenu>
          <MainMenu.DefaultItems.CommandPalette />
          <MainMenu.DefaultItems.SearchMenu />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.Separator />
          <MainMenu.DefaultItems.Help />
        </MainMenu>
      </Excalidraw>
    </Box>
  );
};

export default ExcalidrawBoard;
