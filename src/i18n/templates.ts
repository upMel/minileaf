import type { Dictionary } from "./en";

type TemplateLabel = { name: string; description: string };

/**
 * Layout templates are defined as data in `@/lib/layout-templates`, keyed by id.
 * This resolves a template id to its localized name/description, falling back to
 * the definition's own English text if a template has no dictionary entry yet.
 */
export function templateLabel(
  t: Dictionary,
  id: string,
  fallback: TemplateLabel,
): TemplateLabel {
  const entries = t.templates as Record<string, TemplateLabel | undefined>;
  return entries[id] ?? fallback;
}
