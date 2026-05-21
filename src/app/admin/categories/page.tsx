"use client";

import { useQuery } from "@tanstack/react-query";

import { useAdminAuthContext } from "@/context/AdminAuthContext";

import CategoryManager from "../CategoryManager";
import { categoriesQueryOptions } from "./_queries";

export default function CategoriesPage() {
  const { supabase, adminState } = useAdminAuthContext();
  const isAuthorized = adminState.status === "authorized";

  const { data: dbCategories = [] } = useQuery(
    categoriesQueryOptions(supabase!, isAuthorized),
  );

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">Categories</h1>
      <div className="max-w-3xl rounded-2xl border border-black/10 bg-white dark:border-white/15 dark:bg-zinc-900">
        <CategoryManager
          supabase={supabase!}
          categories={dbCategories}
        />
      </div>
    </div>
  );
}

