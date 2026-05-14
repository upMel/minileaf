"use client";

import { useCallback, useEffect, useState } from "react";

import { useAdminAuthContext } from "@/context/AdminAuthContext";
import { fetchCategories } from "@/services/categories";
import type { CategoryRow } from "@/types/admin";

import CategoryManager from "../CategoryManager";

export default function CategoriesPage() {
  const { supabase, adminState } = useAdminAuthContext();
  const isAuthorized = adminState.status === "authorized";

  const [dbCategories, setDbCategories] = useState<CategoryRow[]>([]);
  const loadCategories = useCallback(async () => {
    if (!supabase || !isAuthorized) return;
    const { data } = await fetchCategories(supabase);
    setDbCategories(data);
  }, [supabase, isAuthorized]);

  useEffect(() => { void loadCategories(); }, [loadCategories]);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">Categories</h1>
      <div className="max-w-3xl rounded-2xl border border-black/10 bg-white dark:border-white/15 dark:bg-zinc-900">
        <CategoryManager
          supabase={supabase!}
          categories={dbCategories}
          onRefresh={() => void loadCategories()}
        />
      </div>
    </div>
  );
}
