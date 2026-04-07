"use client";

interface HomeHeroProps {
  query: string;
  onQueryChange: (value: string) => void;
}

export function HomeHero({ query, onQueryChange }: HomeHeroProps) {
  return (
    <div className="home-hero">
      <div className="home-starfield" aria-hidden />
      <div className="home-hero-inner">
        <h1 className="home-brand">
          <span className="home-brand-serif">map of math</span>
          <span className="home-brand-version">v0.1</span>
        </h1>

        <form
          className="home-search-pill"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            document.getElementById("section-search")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <span className="home-search-icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="search"
            name="q"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search concepts, theorems, mathematicians…"
            autoComplete="off"
            aria-label="Search"
          />
          <button type="submit" className="home-search-submit" aria-label="Go to results">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>

        <nav className="home-explore-links" aria-label="Explore sections">
          <a href="#section-graph">explore connection</a>
          <span className="home-explore-dot" aria-hidden>
            ·
          </span>
          <a href="#section-timeline">explore timeline</a>
        </nav>
      </div>
    </div>
  );
}
