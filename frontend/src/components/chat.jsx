import React, { useState, useEffect } from 'react';
import WebSocketInstance from './web_socket_service';
import { useParams } from 'react-router-dom';
import Navigation from './main_navigation';
import './../styles/chat.css'

const Chat = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const { roomName } = useParams();
    

    useEffect(() => {
        const auth = window.sessionStorage.getItem("Token");
        WebSocketInstance.connect(roomName, auth);
        WebSocketInstance.addCallbacks(messageCallback);

        return () => {
            WebSocketInstance.socketRef.close();
        };
    }, [roomName]);

    const messageCallback = (parsedData) => {
        setMessages((prevMessages) => [...prevMessages, parsedData.message]);
    };

    const sendMessageHandler = (e) => {
        e.preventDefault();
        const messageObject = {
            message: message,
            command: 'message',
        };
        WebSocketInstance.sendMessage(messageObject);
        setMessage('');
    };

    return (
        <>
            <Navigation />
            <div className="chat-container">
                <p className="chat-room-name">Chat room: {roomName}</p>
                <div className="chat-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className="chat-message">{msg}</div>
                    ))}
                </div>
                <form onSubmit={sendMessageHandler} className="chat-form">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="chat-input"
                        placeholder="Type your message here..."
                    />
                    <button type="submit" className="chat-send-button">Send</button>
                </form>
            </div>
        </>
    );
};

export default Chat;
