"use client";

import { Component, type ReactNode } from "react";

import { useT } from "@/context/LanguageContext";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = { hasError: boolean; message: string };

/**
 * Fallback UI. Split into a function component so it can read the language
 * context — class components can't use hooks.
 */
function ErrorFallback({ message, onReset }: { message: string; onReset: () => void }) {
  const t = useT();

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-sm rounded-2xl border border-black/10 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-zinc-900">
        <p className="text-sm font-semibold text-black dark:text-zinc-50">
          {t.common.somethingWentWrong}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {message || t.common.unexpectedError}
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-4 rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          {t.common.tryAgain}
        </button>
      </div>
    </div>
  );
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    // Left untranslated here — the fallback substitutes a localized message
    // when this is empty.
    const message = error instanceof Error ? error.message : "";
    return { hasError: true, message };
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <ErrorFallback
            message={this.state.message}
            onReset={() => this.setState({ hasError: false, message: "" })}
          />
        )
      );
    }

    return this.props.children;
  }
}
