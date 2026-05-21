"use client";

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

export type Layout = {
  id: string;
  name: string;
  orientation: "portrait" | "landscape";
  is_active: boolean;
  created_at: string;
};

// ── Queries ───────────────────────────────────────────────────────────────────

export const layoutsQueryOptions = queryOptions<Layout[]>({
  queryKey: ["layouts"],
  queryFn: (): Promise<Layout[]> => fetch("/api/layouts").then((r) => r.json()),
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; orientation: "portrait" | "landscape" }) =>
      fetch("/api/layouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create layout");
        return r.json() as Promise<Layout>;
      }),
    onSuccess: () => queryClient.invalidateQueries(layoutsQueryOptions),
  });
}

export function useUpdateLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & Partial<Pick<Layout, "name" | "orientation" | "is_active">>) =>
      fetch(`/api/layouts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to update layout");
        return r.json();
      }),
    onSuccess: () => queryClient.invalidateQueries(layoutsQueryOptions),
  });
}

export function useDeleteLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/layouts/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete layout");
      }),
    onSuccess: () => queryClient.invalidateQueries(layoutsQueryOptions),
  });
}
