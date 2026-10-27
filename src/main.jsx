import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { AppProvider } from './state/AppProvider.jsx';
import App from './App.jsx';
import './styles.css';
const Router = import.meta.env.BASE_URL === '/' ? BrowserRouter : HashRouter;
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AppProvider><App /></AppProvider>
    </Router>
  </React.StrictMode>
);