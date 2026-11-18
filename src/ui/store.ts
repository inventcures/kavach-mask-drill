import type { RunStore } from '../engine/telemetry';

/** The phone's own storage, or null where the browser refuses it (some private modes throw on access). */
export function phoneStore(): RunStore | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

/** Hands the player a file to save. Nothing is uploaded: the file is built in the page. */
export function downloadText(filename: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
