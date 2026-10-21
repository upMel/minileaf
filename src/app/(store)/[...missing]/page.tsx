import { notFound } from "next/navigation";

// Any address that matches no page renders the shop's own 404 (with header
// and footer) instead of the bare default one.
export default function MissingPage() {
  notFound();
}
