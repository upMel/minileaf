"use client";

import { useEffect, useState } from "react";

/**
 * Placeholder that types itself out, phrase after phrase (~90 ms a letter,
 * a short hold, then the next one) — like the reference site. Stops on the
 * first phrase while `running` is false (input focused or filled) and when
 * the visitor prefers reduced motion.
 */
export function useTypingPlaceholder(phrases: readonly string[], running: boolean): string {
  const [text, setText] = useState(phrases[0] ?? "");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!running || reduce || phrases.length === 0) {
      const id = setTimeout(() => setText(phrases[0] ?? ""), 0);
      return () => clearTimeout(id);
    }

    let phrase = 0;
    let pos = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (document.hidden) {
        timer = setTimeout(tick, 1000);
        return;
      }
      const current = phrases[phrase];
      if (pos < current.length) {
        pos += 1;
        setText(current.slice(0, pos));
        timer = setTimeout(tick, 80 + Math.random() * 30);
        return;
      }
      timer = setTimeout(() => {
        phrase = (phrase + 1) % phrases.length;
        pos = 0;
        setText("");
        timer = setTimeout(tick, 250);
      }, 1100);
    };

    timer = setTimeout(() => {
      setText("");
      tick();
    }, 300);
    return () => clearTimeout(timer);
  }, [phrases, running]);

  return text;
}
