import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

console.log('Main.jsx starting application...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('CRITICAL: Root element #root not found!');
  document.body.innerHTML = '<div style="background:red;color:white;padding:20px;font-family:sans-serif">Error: #root element missing from page.</div>';
} else {
  const root = createRoot(rootElement);
  root.render(<App />);
}
