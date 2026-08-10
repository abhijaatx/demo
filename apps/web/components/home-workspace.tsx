"use client";

import {
  AnalyticsIcon,
  DemosIcon,
  HubsIcon,
  HomeIcon,
  SearchIcon,
  SettingsIcon
} from "@supademo/ui";
import { useMemo, useState } from "react";

type HomeTab = "Supademos" | "Showcases" | "Analytics" | "New Features";

const demoCards = [
  {
    id: "demo-urban-enforcement",
    title: "Optimize Urban Enforcement Center",
    owner: "Abhijaat Krishna",
    date: "21 Jun",
    tone: "urban",
    image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/x7a-cMKvfK0wUo3qbir7U.jpg"
  },
  {
    id: "demo-amazon-fresh",
    title: "Complete an Amazon Fresh purchase",
    owner: "Abhijaat Krishna",
    date: "15 Jun",
    tone: "fresh",
    image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/ZMshzrt2rbFa0JBgMXOrz.jpg"
  },
  {
    id: "demo-shop-products",
    title: "Shop and Discover Products",
    owner: "Abhijaat Krishna",
    date: "15 Jun",
    tone: "shop",
    image: "https://media.supademo.com/clyp848gi00nlgwbspl1gpyow/2jAdK1WdzdugSw97h-AFM.jpg"
  },
  {
    id: "demo-export-cases",
    title: "Search, View, and Export Cases",
    owner: "Abhijaat Krishna",
    date: "15 Jun",
    tone: "search",
    image:
      "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/screenshots/_j3D8XqsrOrl8rDn8fq3D.jpg"
  },
  {
    id: "demo-product-walkthrough",
    title: "Interactive Product Walkthrough",
    owner: "Abhijaat Krishna",
    date: "15 Jun",
    tone: "interactive",
    image: "https://media.supademo.com/clf7r5s6900giyy0h6trezsck/Xv_XoVIntLPIGeWdNjOEP.jpg"
  }
] as const;

type DemoCard = (typeof demoCards)[number];

const tabCards: Record<HomeTab, readonly DemoCard[]> = {
  Supademos: demoCards,
  Showcases: demoCards.slice(1).concat(demoCards.slice(0, 1)),
  Analytics: demoCards.slice(2).concat(demoCards.slice(0, 2)),
  "New Features": demoCards.slice(3).concat(demoCards.slice(0, 3))
};

const lessons = [
  {
    icon: "globe",
    title: "Convert with website demos",
    text: "Learn how to build interactive, self-serve demo that drives higher conversion.",
    href: "/demos"
  },
  {
    icon: "link",
    title: "Create trackable demo links",
    text: "Share demos with unique links that track engagement down to every step.",
    href: "/analytics"
  },
  {
    icon: "wand",
    title: "Edit & personalize with MCP",
    text: "Use natural language prompts to instantly edit, update, and personalize demos at scale.",
    href: "/product"
  }
] as const;

const juneUpdateArtwork =
  "https://cdn.sanity.io/images/eyuvl764/production/68a3fe1fde7e6f9fa6b2a3ecc470b6da291fee62-1672x941.png?w=1200&q=80&auto=format";

function LogoMark() {
  return (
    <span className="home-logo-mark" aria-hidden="true">
      S
    </span>
  );
}

function LessonIcon({ kind }: { kind: (typeof lessons)[number]["icon"] }) {
  return <span className={`home-lesson-icon home-lesson-icon-${kind}`} aria-hidden="true" />;
}

export function HomeWorkspace() {
  const [activeTab, setActiveTab] = useState<HomeTab>("Supademos");
  const [query, setQuery] = useState("");
  const [featuredVisible, setFeaturedVisible] = useState(true);

  const visibleDemos = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tabCards[activeTab].filter(
      (demo) => !normalized || demo.title.toLowerCase().includes(normalized)
    );
  }, [activeTab, query]);

  return (
    <div className="home-workspace">
      <aside className="home-sidebar" aria-label="Workspace navigation">
        <div className="home-sidebar-top">
          <a className="home-workspace-switcher" href="/home" aria-label="My Workspace home">
            <LogoMark />
            <span>
              <strong>My Workspace</strong>
              <small>Free · Admin</small>
            </span>
            <span className="home-chevron" aria-hidden="true" />
          </a>
          <nav className="home-primary-nav">
            <a className="home-nav-item is-active" href="/home" aria-current="page">
              <HomeIcon /> <span>Home</span>
            </a>
            <p className="home-nav-label">Create</p>
            <a className="home-nav-item" href="/demos">
              <DemosIcon /> <span>Supademos</span>
            </a>
            <a className="home-nav-item" href="/videos">
              <span className="home-nav-video" aria-hidden="true" /> <span>Videos</span>
            </a>
            <a className="home-nav-item" href="/ai/demo-agents">
              <span className="home-nav-wand" aria-hidden="true" /> <span>Demo agents</span>
              <em>Beta</em>
            </a>
            <p className="home-nav-label">Share</p>
            <a className="home-nav-item" href="/showcases">
              <HubsIcon /> <span>Showcases</span>
            </a>
            <a className="home-nav-item" href="/hubs">
              <span className="home-nav-stack" aria-hidden="true" /> <span>Demo hubs</span>
            </a>
            <a className="home-nav-item" href="/routes">
              <span className="home-nav-route" aria-hidden="true" /> <span>Route hubs</span>
              <em>New</em>
            </a>
            <p className="home-nav-label">Measure</p>
            <a className="home-nav-item" href="/analytics">
              <AnalyticsIcon /> <span>Analytics</span>
            </a>
          </nav>
        </div>
        <div className="home-sidebar-bottom">
          <section className="home-upgrade-card" aria-label="Upgrade workspace">
            <span className="home-upgrade-star" aria-hidden="true" />
            <strong>Unlock premium features</strong>
            <p>Get the most out of Supademo with 30+ pro features.</p>
            <a href="/app?section=billing">Upgrade</a>
          </section>
          <div className="home-account-row">
            <span>
              <strong>Abhijaat Krishna</strong>
              <small>krishnaabhijaat@gmail.com</small>
            </span>
            <a href="/settings/profile" aria-label="Account settings">
              <SettingsIcon />
            </a>
            <button type="button" aria-label="Notifications">
              <span className="home-bell" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <div className="home-main">
        <header className="home-topbar">
          <a href="/home" aria-label="Home">
            <HomeIcon />
          </a>
          <div className="home-top-actions">
            <a className="home-earn" href="/app?section=billing">
              <span className="home-gift" aria-hidden="true" /> Earn $200
            </a>
            <label className="home-search">
              <SearchIcon />
              <span className="sr-only">Search workspace</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="Search..."
              />
              <kbd>⌘K</kbd>
            </label>
          </div>
        </header>

        <main className="home-content">
          {featuredVisible ? (
            <section className="home-featured" aria-labelledby="featured-heading">
              <div className="home-featured-copy">
                <h1 id="featured-heading">
                  Voiceovers 2.0, Advanced Search, UI Redesign &amp; New Integrations
                </h1>
                <p>Explore five core updates from June 2026 in four minutes.</p>
                <div className="home-featured-actions">
                  <a href="/blog/product-update-june-recap" className="home-primary-button">
                    Watch 4 min recap
                  </a>
                  <button
                    type="button"
                    className="home-dismiss"
                    onClick={() => setFeaturedVisible(false)}
                  >
                    <span aria-hidden="true">×</span> Dismiss
                  </button>
                </div>
              </div>
              <div className="home-featured-art">
                <img
                  className="home-featured-image"
                  src={juneUpdateArtwork}
                  alt="June 2026 Supademo product updates"
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              </div>
            </section>
          ) : (
            <div className="home-featured-dismissed" role="status">
              Featured update dismissed.{" "}
              <button type="button" onClick={() => setFeaturedVisible(true)}>
                Show it again
              </button>
            </div>
          )}

          <section className="home-library" aria-labelledby="library-heading">
            <div className="home-tabs" role="tablist" aria-label="Workspace content">
              {(Object.keys(tabCards) as HomeTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  className={activeTab === tab ? "is-active" : ""}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <h2 id="library-heading" className="sr-only">
              {activeTab}
            </h2>
            <div className="home-demo-row" aria-live="polite">
              {visibleDemos.length ? (
                visibleDemos.map((demo) => (
                  <a
                    className="home-demo-card"
                    href={`/demos/${demo.id}/edit?sample=1`}
                    key={`${activeTab}-${demo.title}`}
                  >
                    <span className={`home-demo-thumb tone-${demo.tone}`}>
                      <img
                        src={demo.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                    </span>
                    <strong>{demo.title}</strong>
                    <small>
                      {demo.owner} · {demo.date}
                    </small>
                  </a>
                ))
              ) : (
                <p className="home-empty">No demos match “{query}”.</p>
              )}
            </div>
          </section>

          <section className="home-lessons" aria-labelledby="lessons-heading">
            <h2 id="lessons-heading">Explore lessons by goal</h2>
            <div className="home-lesson-grid">
              {lessons.map((lesson) => (
                <article className="home-lesson-card" key={lesson.title}>
                  <LessonIcon kind={lesson.icon} />
                  <h3>{lesson.title}</h3>
                  <p>{lesson.text}</p>
                  <a href={lesson.href}>Explore</a>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
