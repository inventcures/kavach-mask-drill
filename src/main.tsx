import { render } from 'preact';
import { App } from './app';
import './styles.css';

render(<App />, document.getElementById('app')!);

// Offline support. The worker is generated at build time, so skip it in dev.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* the app still works online without it */
    });
  });
}
