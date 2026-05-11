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
        const path = `/direct-chat/${roomName}/?token=${token}`;
        const wsURL = getWebSocketURL(path);
        this.socketRef = new WebSocket(wsURL);

        this.socketRef.onopen = () => {
            if (this.callbacks.open) {
                this.callbacks.open();
            }
            console.log('WebSocket open');
        };

        this.socketRef.onmessage = e => {
            this.socketNewMessage(e.data);
        };

        this.socketRef.onclose = () => {
            if (this.callbacks.close) {
                this.callbacks.close();
            }
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
            if (this.callbacks.close) {
                this.callbacks.close();
            }
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
            this.socketRef.send(JSON.stringify({ message: data.message }));
        } catch (err) {
            console.log(err.message);
        }
    }

    addCallbacks(messageCallback, openCallback = null, closeCallback = null) {
        this.callbacks['message'] = messageCallback;
        this.callbacks['open'] = openCallback;
        this.callbacks['close'] = closeCallback;
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
