import { notFound } from "next/navigation";

// Any unknown URL under a locale renders the localized 404.

export default function CatchAll() {
  notFound();
}
