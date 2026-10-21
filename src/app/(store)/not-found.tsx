"use client";

import EmptyState from "@/components/store/EmptyState";
import { useT } from "@/context/LanguageContext";
import { routes } from "@/lib/routes";

/** 404 inside the shop's header and footer (unknown product, category or address). */
export default function StoreNotFound() {
  const t = useT().store.notFound;
  return (
    <div className="ks-page-gap">
      <EmptyState title={t.title} text={t.text} action={{ href: routes.home(), label: t.backHome }} />
    </div>
  );
}
