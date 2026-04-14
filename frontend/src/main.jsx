import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
    // StrictMode deliberately runs effects twice in development to surface side-effect bugs early
    <StrictMode>
        {/* BrowserRouter lives at the top level so every component in the tree can use routing */}
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>,
)