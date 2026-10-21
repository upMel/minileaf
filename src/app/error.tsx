"use client";

import { useEffect } from "react";

import { useT } from "@/context/LanguageContext";

/** Last-resort error screen (a page threw while rendering). */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT().errorPage;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="app-state">
      <div className="app-error" role="alert">
        <h1>{t.title}</h1>
        <p>{t.text}</p>
        <button type="button" onClick={reset}>
          {t.retry}
        </button>
      </div>
    </div>
  );
}
