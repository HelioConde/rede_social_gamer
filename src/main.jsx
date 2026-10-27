import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { AppProvider } from './state/AppProvider.jsx';
import { ChatProvider } from './state/ChatProvider.jsx';
import App from './App.jsx';
import './styles.css';
import './chat.css';
const Router = import.meta.env.BASE_URL === '/' ? BrowserRouter : HashRouter;
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AppProvider><ChatProvider><App /></ChatProvider></AppProvider>
    </Router>
  </React.StrictMode>
);