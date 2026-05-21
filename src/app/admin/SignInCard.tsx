"use client";

import { useState } from "react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import TextInput from "@/components/inputs/TextInput";

type Props = {
  /** Returns an error string on failure, or null on success. */
  onSignIn: (email: string, password: string) => Promise<string | null>;
};

export default function SignInCard({ onSignIn }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const err = await onSignIn(email, password);
    if (err) {
      setError(err);
    } else {
      setEmail("");
      setPassword("");
    }
    setIsSubmitting(false);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3">
          <Field label="Email">
            <TextInput
              value={email}
              onChange={setEmail}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
            />
          </Field>

          <Field label="Password">
            <TextInput
              value={password}
              onChange={setPassword}
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>

          {error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}

          <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
