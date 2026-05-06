// Helper function to build WebSocket URL
function getWebSocketURL(path) {
    const WEBSOCKET_URL = import.meta.env.VITE_REACT_APP_WEBSOCKET_URL;

    if (!WEBSOCKET_URL) {
        throw new Error('VITE_REACT_APP_WEBSOCKET_URL environment variable is not set');
    }

    if (!WEBSOCKET_URL.startsWith('ws://') && !WEBSOCKET_URL.startsWith('wss://')) {
        throw new Error(
            `Invalid VITE_REACT_APP_WEBSOCKET_URL: "${WEBSOCKET_URL}". ` +
            'Must start with ws:// or wss://'
        );
    }

    return `${WEBSOCKET_URL}${path}`;
}

class WhiteboardSocketService {
  constructor(roomId) {
    this.roomId = roomId;
    const token = window.sessionStorage.getItem("token");
    const wsUrl = `${getWebSocketURL(`/whiteboard/${roomId}/`)}?token=${token}`;
    this.ws = new WebSocket(wsUrl);
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.ws.onopen = () => {
      console.log('Connected to whiteboard socket');
      this.requestStateSync();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = (event) => {
      console.log('Disconnected from whiteboard socket');

      // Check close codes for authentication errors
      if (event.code === 4001) {
        console.error('Authentication failed - invalid or missing token');
        return; // Don't reconnect
      }
      if (event.code === 4003) {
        console.error('Access denied - you do not have permission to access this classroom');
        return; // Don't reconnect
      }

      // Attempt to reconnect after 3 seconds for other errors
      setTimeout(() => {
        const token = window.sessionStorage.getItem("token");
        const wsUrl = `${getWebSocketURL(`/whiteboard/${this.roomId}/`)}?token=${token}`;
        this.ws = new WebSocket(wsUrl);
        this.setupWebSocket();
      }, 3000);
    };
  }

  // Send drawing events to the server
  emitDrawingEvent(eventType, data) {
    console.log("Emitting drawing event:", eventType, data);
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: eventType,
        action: 'draw',
        payload: data,
        timestamp: Date.now()
      }));
    }
  }

  // Subscribe to drawing events
  subscribeToDrawingEvents(callback) {
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };
  }

  // Request current state from server
  requestStateSync() {
    this.emitDrawingEvent('sync_request', {});
  }

  // Clean disconnect
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

export default WhiteboardSocketService;
