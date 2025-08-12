class WhiteboardSocketService {
  constructor(roomId) {
    this.ws = new WebSocket(`ws://localhost:8000/ws/whiteboard/${roomId}/`);
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
