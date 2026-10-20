import './i18n';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app.tsx'
import './index.css'
import { AppErrorBoundary, reloadOnceForNewVersion, reloadIfOutdatedBuild, clearReloadMarker } from './components/common/app-error-boundary'

// A tab opened before a deploy asks for page files that no longer exist; reload once to get the new version.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnceForNewVersion()) event.preventDefault();
});
// A cached index.html can start an older build; switch to the current one.
reloadIfOutdatedBuild();
// The app is running fine: allow the reload again for the next deploy.
window.setTimeout(clearReloadMarker, 15000);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
)
