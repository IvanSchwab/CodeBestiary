import { fill, type Dictionary } from "@/dictionaries";
import { AUTHOR_NAME, REPO_URL } from "@/lib/site";

export function SiteFooter({ dict }: { dict: Dictionary }) {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto flex max-w-[82rem] flex-wrap items-center justify-between gap-3 px-5 py-6 sm:px-8">
        <p className="label">{fill(dict.footer.by, { author: AUTHOR_NAME })}</p>
        <a href={REPO_URL} className="label transition-colors hover:!text-accent">
          {dict.footer.source}
        </a>
      </div>
    </footer>
  );
}
