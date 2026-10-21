"use client";

/* eslint-disable @next/next/no-img-element -- admin previews must show any link without next/image host rules */

import { useId, useRef, useState } from "react";

import { useAdminAuthContext } from "@/context/AdminAuthContext";
import { useT } from "@/context/LanguageContext";
import { SITE_IMAGES_BUCKET, UploadError, uploadImage } from "@/services/storage";

type Props = {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  /** Storage folder inside the site-images bucket, e.g. "banners". */
  folder: string;
  /** Longest side after shrinking in the browser. Canva pages need more pixels than tiles. */
  maxSide?: number;
  hint?: string;
  /** Preview box shape, e.g. "16 / 6" for a banner, "210 / 297" for an A4 page. */
  aspect?: string;
  disabled?: boolean;
  /** Largest file accepted from the device, in MB (it's shrunk before upload). */
  maxMb?: number;
  /** Whether the picture can be removed (a Canva flyer page can only be replaced). */
  removable?: boolean;
};

/** Upload (or replace / remove) one picture for the site: banners, flyer pages, categories. */
export default function ImageField({
  label,
  value,
  onChange,
  folder,
  maxSide = 1600,
  hint,
  aspect,
  disabled,
  maxMb = 8,
  removable = true,
}: Props) {
  const t = useT().admin;
  const p = t.products;
  const { supabase } = useAdminAuthContext();
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file || !supabase) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(supabase, file, { bucket: SITE_IMAGES_BUCKET, folder, maxSide, maxInputBytes: maxMb * 1024 * 1024 }));
    } catch (e) {
      const kind = e instanceof UploadError ? e.kind : "failed";
      setError(kind === "not-image" ? p.errors.imageType : kind === "too-large" ? t.image.tooLarge(maxMb) : p.errors.upload);
    } finally {
      setBusy(false);
    }
  }

  const showable = Boolean(value && /^(https?:\/\/|\/)/.test(value));

  return (
    <div className="ka-field">
      <span>{label}</span>
      <div className="ka-upload">
        {value ? (
          <div className="ka-upload-preview" style={aspect ? { aspectRatio: aspect, height: "auto", maxHeight: 420 } : undefined}>
            {showable && <img src={value} alt="" />}
          </div>
        ) : (
          <button
            type="button"
            className="ka-upload-placeholder ka-upload-button"
            style={aspect ? { aspectRatio: aspect, minHeight: 0 } : undefined}
            onClick={() => fileRef.current?.click()}
            disabled={disabled || busy}
          >
            <b>＋</b>
            <span>{busy ? p.photoUploading : t.image.pick}</span>
          </button>
        )}
        {value && (
          <div className="ka-upload-actions">
            <button type="button" className="ka-btn-small" onClick={() => fileRef.current?.click()} disabled={disabled || busy}>
              {busy ? p.photoUploading : t.image.replace}
            </button>
            {removable && (
              <button type="button" className="ka-text-btn" onClick={() => onChange(null)} disabled={disabled || busy}>
                {p.photoRemove}
              </button>
            )}
          </div>
        )}
        <input
          id={inputId}
          ref={fileRef}
          className="ka-file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          tabIndex={-1}
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {hint && <small className="ka-hint">{hint}</small>}
        {error && <p className="ka-error">{error}</p>}
      </div>
    </div>
  );
}
