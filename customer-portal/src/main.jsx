import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Remove initial loader when React app mounts
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('app-loaded');
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);