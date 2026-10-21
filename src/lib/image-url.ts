/**
 * Image addresses we're willing to render: the site's own files ("/…") or
 * https. Anything else (http://, javascript:, typos) is dropped, because
 * next/image throws on hosts or protocols it isn't configured for, and one
 * bad link must never take a page down.
 */
export function safeImageUrl(value: string | null | undefined): string | undefined {
  const url = value?.trim();
  if (!url) return undefined;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  return /^https:\/\/[^\s]+$/i.test(url) ? url : undefined;
}
