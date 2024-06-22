// Login.js
import React, { useState } from 'react';

import '../styles/master-screen.css'
import Navigation from '../components/main_navigation';

function MasterScreen({ children }) {
    return (
        <>
            <Navigation />
            <div className="content">
                {children}
            </div>
        </>
    );
}

export default MasterScreen;