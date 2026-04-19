/**
 * Trigger a browser file download from a data URI.
 * @param uri - Data URI or blob URL to download
 * @param filename - Suggested filename for the download
 */
export function triggerDownload(uri: string, filename: string): void {
  const a = document.createElement('a');
  a.href = uri;
  a.download = filename;
  a.click();
}
