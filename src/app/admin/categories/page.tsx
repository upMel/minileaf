"use client";

import { useSyncExternalStore } from "react";

import { useT } from "@/context/LanguageContext";

import CategoriesEditor from "./CategoriesEditor";
import OfferGroupsEditor from "./OfferGroupsEditor";

const GROUPS_HASH = "#groups";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/** Κατηγορίες: the catalogue's categories, and the offer groups of the Προσφορές page (#groups). */
export default function AdminCategoriesPage() {
  const a = useT().admin;
  const c = a.categories;
  const groups = useSyncExternalStore(
    subscribe,
    () => window.location.hash === GROUPS_HASH,
    () => false,
  );

  function show(next: boolean) {
    if (next === groups) return;
    window.location.hash = next ? GROUPS_HASH : "";
  }

  return (
    <>
      <div className="ka-intro">
        <p>{a.eyebrow}</p>
        <h1>{c.title}</h1>
        <span>{c.subtitle}</span>
      </div>
      <div className="ka-seg ka-subtabs" role="group" aria-label={c.title}>
        <button type="button" aria-pressed={!groups} onClick={() => show(false)}>
          {c.viewCategories}
        </button>
        <button type="button" aria-pressed={groups} onClick={() => show(true)}>
          {c.viewGroups}
        </button>
      </div>
      {groups ? <OfferGroupsEditor /> : <CategoriesEditor />}
    </>
  );
}
