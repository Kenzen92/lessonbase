const WEBSOCKET_URL = import.meta.env.VITE_REACT_APP_WEBSOCKET_URL;

// Helper function to build WebSocket URL with correct protocol
function getWebSocketURL(path) {
    // If WEBSOCKET_URL already has a protocol (ws:// or wss://), use it directly
    if (WEBSOCKET_URL.startsWith('ws://') || WEBSOCKET_URL.startsWith('wss://')) {
        return `${WEBSOCKET_URL}${path}`;
    }
    
    // Otherwise, use current page protocol to determine ws/wss
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = WEBSOCKET_URL.startsWith('/') ? window.location.host : '';
    const base = WEBSOCKET_URL.startsWith('/') ? WEBSOCKET_URL : `/${WEBSOCKET_URL}`;
    
    return `${protocol}//${host}${base}${path}`;
}

class WebSocketService {
    static instance = null;
    callbacks = {};

    static getInstance() {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    constructor() {
        this.socketRef = null;
    }

    connect(roomName, token) {
        const path = `/chat/${roomName}/?token=${token}`;
        const wsURL = getWebSocketURL(path);
        this.socketRef = new WebSocket(wsURL);

        this.socketRef.onopen = () => {
            console.log('WebSocket open');
        };

        this.socketRef.onmessage = e => {
            this.socketNewMessage(e.data);
        };

        this.socketRef.onclose = () => {
            console.log('WebSocket closed');
        };

        this.socketRef.onerror = e => {
            console.error('WebSocket error', e);
        };
    }

    disconnect() {
        if (this.socketRef) {
            this.socketRef.close();
            this.socketRef = null; // Ensure the connection is cleared
            console.log("WebSocket connection closed manually");
        }
    }

    socketNewMessage(data) {
        const parsedData = JSON.parse(data);
        const command = parsedData.command;
        if (Object.keys(this.callbacks).length === 0) {
            return;
        }
        this.callbacks['message'](parsedData);
    }

    sendMessage(data) {
        try {
            this.socketRef.send(JSON.stringify({ ...data }));
        } catch (err) {
            console.log(err.message);
        }
    }

    addCallbacks(messageCallback) {
        this.callbacks['message'] = messageCallback;
    }

    waitForSocketConnection(callback) {
        const socket = this.socketRef;
        const recursion = this.waitForSocketConnection;
        setTimeout(
            function () {
                if (socket.readyState === 1) {
                    callback();
                } else {
                    recursion(callback);
                }
            }, 1);
    }
}

const WebSocketInstance = WebSocketService.getInstance();

export default WebSocketInstance;
