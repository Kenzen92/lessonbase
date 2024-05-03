// ToastNotification.js
import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ToastNotification({ message }) { // Accepting 'message' prop
    const notify = () => toast(message); // Using the 'message' prop

    return (
        <div>
            <ToastContainer />
        </div>
    );
}

export default ToastNotification;
