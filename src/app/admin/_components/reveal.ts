/**
 * When the builder layout is a single column (phones, small tablets), the
 * editor sits below a long list; bring it into view after a pick.
 */
export function revealEditor(el: HTMLElement | null) {
  if (!el || !window.matchMedia("(max-width: 1000px)").matches) return;
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => el.scrollIntoView({ block: "start", behavior: smooth ? "smooth" : "auto" }));
}
