import React from 'react';
import i18n from '@/i18n';

/** Errors from loading a page's code file — typical when a tab from before a deploy asks for files that no longer exist. */
export function isChunkLoadError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message ?? error ?? '');
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Expected a JavaScript module|ChunkLoadError/i.test(message);
}

const RELOAD_KEY = 'cf-reloaded-after-deploy';

/** Reloads the page once to pick up the new version after a deploy. Returns false if it already tried. */
export function reloadOnceForNewVersion(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_KEY)) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // storage blocked: reload anyway, the browser fetches the new version
  }
  window.location.reload();
  return true;
}

/** Called once the app has run for a while, so a later deploy can trigger the reload again. */
export function clearReloadMarker(): void {
  try { sessionStorage.removeItem(RELOAD_KEY); } catch { /* storage blocked */ }
}

interface State {
  error: Error | null;
}

/**
 * Shows a short message with a reload button instead of a blank page when something on a page
 * crashes. If the crash is a page file that failed to load after a deploy, it reloads once by itself.
 */
export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    console.error('[app] page crashed', error);
    if (isChunkLoadError(error)) reloadOnceForNewVersion();
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const t = (key: string, fallback: string) => i18n.t(key, { ns: 'common', defaultValue: fallback });
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7faf9] px-4">
        <div className="max-w-md w-full bg-white border border-[#e5efea] rounded-[16px] shadow-sm p-8 text-center">
          <h1 className="text-xl font-bold text-[#0d0e0e] mb-2">{t('appError.title', 'Something went wrong')}</h1>
          <p className="text-sm text-[#374151] mb-6">
            {t('appError.text', 'The page could not be shown. Please reload the page to try again.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={() => { clearReloadMarker(); window.location.reload(); }}
              className="rounded-[8px] px-5 py-2.5 text-sm font-medium text-white bg-[#1a5948] hover:bg-[#164a3c]"
            >
              {t('appError.reload', 'Reload the page')}
            </button>
            <button
              type="button"
              onClick={() => { clearReloadMarker(); window.location.assign('/'); }}
              className="rounded-[8px] px-5 py-2.5 text-sm font-medium text-[#0d0e0e] border border-[#e5e7eb] hover:bg-[#f9fafb]"
            >
              {t('appError.home', 'Go to the front page')}
            </button>
          </div>
          <p className="mt-6 text-[11px] text-[#9ca3af] break-words">{error.message}</p>
        </div>
      </div>
    );
  }
}
