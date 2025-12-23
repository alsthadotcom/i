import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'antd/dist/reset.css'; // Ant Design styles
import './index.css';

console.log('Mounting IdeaExchange Application...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Could not find root element to mount to");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('Application mounted successfully.');
} catch (error) {
  console.error('Failed to mount application:', error);
  rootElement.innerHTML = `<div style="color: white; padding: 20px; font-family: sans-serif;">
        <h1 style="color: #ff4444;">Render Error</h1>
        <p>The application failed to start. Check the console for details.</p>
        <pre style="background: #111; padding: 10px; border-radius: 5px; overflow: auto;">${error}</pre>
    </div>`;
}
