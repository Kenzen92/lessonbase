// Helper function to build WebSocket URL with correct protocol
function getWebSocketURL(path) {
    const WEBSOCKET_URL = import.meta.env.VITE_REACT_APP_WEBSOCKET_URL;
    
    // If WEBSOCKET_URL already has a protocol (ws:// or wss://), use it directly
    if (WEBSOCKET_URL && (WEBSOCKET_URL.startsWith('ws://') || WEBSOCKET_URL.startsWith('wss://'))) {
        return `${WEBSOCKET_URL}${path}`;
    }
    
    // Otherwise, use current page protocol to determine ws/wss
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const base = WEBSOCKET_URL && WEBSOCKET_URL.startsWith('/') ? WEBSOCKET_URL : '/ws';
    
    return `${protocol}//${host}${base}${path}`;
}

class WhiteboardSocketService {
  constructor(roomId) {
    this.roomId = roomId;
    this.ws = new WebSocket(getWebSocketURL(`/whiteboard/${roomId}/`));
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

    this.ws.onclose = () => {
      console.log('Disconnected from whiteboard socket');
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        this.ws = new WebSocket(getWebSocketURL(`/whiteboard/${this.roomId}/`));
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
