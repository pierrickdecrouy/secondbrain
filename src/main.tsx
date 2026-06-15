import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'katex/dist/katex.min.css'; // LaTeX Styles
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA
registerSW({ immediate: true });

import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { CardProvider } from './context/CardContext';
import { UIProvider } from './context/UIContext';
import { ToastProvider } from './context/ToastContext';
import { TaskProvider } from './context/TaskContext';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <CardProvider>
              <UIProvider>
                <TaskProvider>
                  <App />
                </TaskProvider>
              </UIProvider>
            </CardProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
