import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/auth_context.jsx'
import { UserProvider } from './contexts/user_context.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  //<React.StrictMode>
    <div className="app-container">
      <AuthProvider>
        <UserProvider>
          <App />
      </UserProvider>
      </AuthProvider>
    </div>
    
  //</React.StrictMode>,
)
