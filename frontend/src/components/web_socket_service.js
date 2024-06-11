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
        const path = `ws://localhost:8000/ws/chat/${roomName}/?token=${token}`;
        this.socketRef = new WebSocket(path);

        this.socketRef.onopen = () => {
            console.log('WebSocket open');
        };

        this.socketRef.onmessage = e => {
            this.socketNewMessage(e.data);
        };

        this.socketRef.onclose = () => {
            console.log('WebSocket closed');
            const auth = window.sessionStorage.getItem("token");
            this.connect(roomName, auth);
        };

        this.socketRef.onerror = e => {
            console.error('WebSocket error', e);
        };
    }

    socketNewMessage(data) {
        console.log("data: ", data)
        const parsedData = JSON.parse(data);
        const command = parsedData.command;
        console.log(parsedData)
        console.log(command)
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
