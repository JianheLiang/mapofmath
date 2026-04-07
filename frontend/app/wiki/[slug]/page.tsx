import Link from "next/link";

import { WikiArticleView } from "@/components/WikiArticleView";
import { getWiki } from "@/lib/api";

export default async function WikiPage({
  params,
}: {
  params: { slug: string };
}) {
  const entry = await getWiki(params.slug);

  return (
    <div className="wiki-layout">
      <header className="wiki-topbar">
        <Link href="/" className="wiki-topbar-brand">
          <span className="wiki-topbar-serif">map of math</span>
          <span className="wiki-topbar-version">v0.1</span>
        </Link>
        <div className="wiki-topbar-actions">
          <Link href="/#section-search" className="wiki-topbar-pill">
            Search
          </Link>
        </div>
      </header>
      <main className="wiki-page">
        <WikiArticleView entry={entry} />
      </main>
    </div>
  );
}
