import { getToken } from "../utils/tokenStorage";

function getWebSocketURL(path) {
  const WEBSOCKET_URL = import.meta.env.VITE_REACT_APP_WEBSOCKET_URL;

  if (!WEBSOCKET_URL) {
    throw new Error("VITE_REACT_APP_WEBSOCKET_URL environment variable is not set");
  }

  if (!WEBSOCKET_URL.startsWith("ws://") && !WEBSOCKET_URL.startsWith("wss://")) {
    throw new Error(
      `Invalid VITE_REACT_APP_WEBSOCKET_URL: "${WEBSOCKET_URL}". Must start with ws:// or wss://`
    );
  }

  return `${WEBSOCKET_URL}${path}`;
}

/**
 * WebSocket transport for the collaborative classroom board.
 *
 * Reconnects with exponential backoff and re-attaches all handlers on every
 * (re)connection — the server replies to each new connection with a fresh
 * scene snapshot, so a reconnect is always followed by a full resync.
 */
class ClassroomBoardSocket {
  constructor(roomId) {
    this.roomId = roomId;
    this.callbacks = {};
    this.openHandlers = [];
    this.closeHandlers = [];
    this.closedByUser = false;
    this.retryDelay = 1000;
    this.connect();
  }

  connect() {
    const token = getToken();
    const wsUrl = `${getWebSocketURL(`/whiteboard/${this.roomId}/`)}?token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.retryDelay = 1000;
      this.openHandlers.forEach((cb) => cb());
    };

    this.ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      this.callbacks[data.type]?.(data.payload);
    };

    this.ws.onclose = (event) => {
      this.closeHandlers.forEach((cb) => cb());
      // 4001 = bad token, 4003 = no classroom access: reconnecting won't help.
      if (this.closedByUser || event.code === 4001 || event.code === 4003) return;
      setTimeout(() => {
        if (!this.closedByUser) this.connect();
      }, this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 2, 15000);
    };

    this.ws.onerror = () => {
      // onclose follows and handles the retry.
    };
  }

  on(type, callback) {
    this.callbacks[type] = callback;
  }

  onOpen(callback) {
    this.openHandlers.push(callback);
    if (this.ws?.readyState === WebSocket.OPEN) callback();
  }

  onClose(callback) {
    this.closeHandlers.push(callback);
  }

  /** Returns true if the message was handed to an open socket. */
  send(type, payload = {}) {
    if (this.ws?.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify({ type, payload }));
    return true;
  }

  disconnect() {
    this.closedByUser = true;
    this.ws?.close();
    this.ws = null;
  }
}

export default ClassroomBoardSocket;
