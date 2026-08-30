import React from 'react';
import ReactDOM from 'react-dom/client';
import RPGGame from './game/RPGGame.jsx';
import { installStorageBridge } from './platform/storageBridge.js';
import './index.css';

installStorageBridge();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RPGGame />
  </React.StrictMode>,
);
