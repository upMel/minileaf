"use client";

import { useT } from "@/context/LanguageContext";
import type { ResolvedFlyer } from "@/lib/data/storefront";
import { routes } from "@/lib/routes";

import EmptyState from "../EmptyState";
import FlyerReader from "../flyer/FlyerReader";

export default function FlyerView({ flyer }: { flyer: ResolvedFlyer | null }) {
  const t = useT().store.flyer;
  return (
    <>
      <div className="ks-page-head ks-page-gap">
        <h1 className="ks-page-title">{t.title}</h1>
      </div>
      {flyer ? (
        <FlyerReader flyer={flyer} />
      ) : (
        <EmptyState title={t.emptyTitle} text={t.emptyText} action={{ href: routes.deals(), label: t.seeDeals }} />
      )}
    </>
  );
}
