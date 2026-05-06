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

class WebRTCSocketService {
  constructor(roomId) {
    this.roomId = roomId;
    this.callbacks = {};
    this.connect();
  }

  connect() {
    const token = window.sessionStorage.getItem("token");
    const wsUrl = `${getWebSocketURL(`/webrtc/${this.roomId}/`)}?token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("Connected to WebRTC signaling socket");
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const callback = this.callbacks[data.type];
      if (callback) {
        callback(data.payload);
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebRTC signaling socket error:", error);
    };

    this.ws.onclose = (event) => {
      console.log("WebRTC signaling socket closed:", event.code);
      if (event.code === 4001 || event.code === 4003) {
        return;
      }
      setTimeout(() => this.connect(), 3000);
    };
  }

  on(eventType, callback) {
    this.callbacks[eventType] = callback;
  }

  send(type, payload) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  sendOffer(sdp) {
    this.send("offer", { sdp });
  }

  sendAnswer(sdp) {
    this.send("answer", { sdp });
  }

  sendIceCandidate(candidate) {
    this.send("ice_candidate", { candidate });
  }

  sendCallEnd() {
    this.send("call_end", {});
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default WebRTCSocketService;
