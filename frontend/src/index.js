import React from 'react';
import ReactDOM from 'react-dom/client';

// Self-hosted variable fonts. `wdth` gives Archivo its width axis, which the
// display type uses for real condensed/expanded weights rather than faking it.
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/jetbrains-mono/index.css';

import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
