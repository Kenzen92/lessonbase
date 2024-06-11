import React, { useState, useEffect } from 'react';
import WebSocketInstance from './web_socket_service';
import { useParams } from 'react-router-dom';
import Navigation from './main_navigation';
import './../styles/chat.css'
import moment from 'moment';

const Chat = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const { roomName } = useParams();
    const [currentUserID, setCurrentUserID] = useState(null);
    

    useEffect(() => {
        const auth = window.sessionStorage.getItem("Token");
        const user_id = window.sessionStorage.getItem("user_id")
        setCurrentUserID(user_id);
        WebSocketInstance.connect(roomName, auth);
        WebSocketInstance.addCallbacks(messageCallback);

        return () => {
            WebSocketInstance.socketRef.close();
        };
    }, [roomName]);

    const messageCallback = (parsedData) => {
        setMessages((prevMessages) => [...prevMessages, {message: parsedData.message, timestamp: parsedData.timestamp, sender: parsedData.sender}]);
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

    const Timestamp = ({ timestamp }) => {
    return moment(timestamp).format('MMM Do [at] HH:mm');
    };


    return (
        <>
            <Navigation />
            <div className="chat-container">
                <p className="chat-room-name">Chat room: {roomName}</p>
                <div className="chat-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className="chat-message">
                        <p className="message-timestamp">{Timestamp(msg.timestamp)}</p>
                        <div className="message-sender-row">
                        <p className="message-sender">{msg.sender.id != currentUserID ? msg.sender.username : null}</p>
                        <p className="message-text">{msg.message}</p>
                        </div>
                        </div>
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
