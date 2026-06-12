/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File 17: frontend/src/main.jsx
 * Entry point of the Secure Vault React Application.
 * Initializes the root React DOM rendering subtree, imports global Tailwind utility
 * styles, and sets up the primary user interface mounting point.
 */

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Locate the mounting root target in the layout index template
const container = document.getElementById('root');

if (!container) {
  throw new Error('Critical Interface Failure: Target layout container "#root" could not be located in document.');
}

const root = createRoot(container);

// Render the underlying mounting nodes
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
