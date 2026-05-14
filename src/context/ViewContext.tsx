"use client";

import { createContext, useContext, useState } from "react";

export type ViewId = "leaflet" | "list" | "category";

interface ViewContextValue {
  view: ViewId;
  setView: (v: ViewId) => void;
}

const ViewContext = createContext<ViewContextValue>({
  view: "leaflet",
  setView: () => {},
});

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<ViewId>("leaflet");
  return (
    <ViewContext.Provider value={{ view, setView }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  return useContext(ViewContext);
}
