/* eslint-disable @next/next/no-img-element -- admin previews must show any link without next/image host rules */

/** Small square picture for admin lists; a blank tile when there's no picture. */
export default function Thumb({ src, size = 48, alt = "" }: { src?: string | null; size?: number; alt?: string }) {
  const ok = Boolean(src && /^(https?:\/\/|\/)/.test(src));
  return (
    <span className="ka-thumb" style={{ width: size, height: size }}>
      {ok && <img src={src!} alt={alt} loading="lazy" />}
    </span>
  );
}
