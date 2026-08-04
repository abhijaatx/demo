"use client";

import { useState } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

const months = ["August 2026", "September 2026", "October 2026"] as const;
const days = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
  28, 29, 30, 31
];

export function MarketingLiveTraining() {
  const [monthIndex, setMonthIndex] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  return (
    <main className="live-training-page" id="main">
      <MarketingHeader />
      <section className="live-training-hero" aria-labelledby="live-training-title">
        <div className="live-training-copy">
          <div className="live-training-limit">
            <span aria-hidden="true" />
            Only 5 spots per session
          </div>
          <div className="live-training-title-row">
            <h1 id="live-training-title">
              Free Live Training
              <br />
              of Supademo
            </h1>
            <div className="live-training-avatars" aria-label="Supademo product experts">
              <span>JD</span>
              <span>AR</span>
              <span>MS</span>
              <span>PK</span>
            </div>
          </div>
          <p>
            Join a free training session to get hands-on guidance, ask questions in real-time, and
            leave with actionable skills to create demos that convert.
          </p>
          <div className="live-training-expectations">
            <h2>
              <span aria-hidden="true">▣</span>What to expect
            </h2>
            <ul>
              <li>
                <span aria-hidden="true">◷</span>30 minutes of focused, actionable training
              </li>
              <li>
                <span aria-hidden="true">♧</span>Max 5 attendees for personalized attention
              </li>
              <li>
                <span aria-hidden="true">✣</span>Live Q&amp;A with our product experts
              </li>
            </ul>
          </div>
        </div>
        <section
          className="live-training-scheduler"
          aria-labelledby="live-training-scheduler-title"
        >
          <div className="live-training-scheduler-brand">
            <span>S</span>
            <span>◉</span>
          </div>
          <p className="live-training-scheduler-company">Supademo</p>
          <h2 id="live-training-scheduler-title">Supademo Group Training</h2>
          <div className="live-training-meta">
            <span>◷</span>30m
          </div>
          <div className="live-training-meta">
            <span>↗</span>Link meeting
          </div>
          <div className="live-training-meta">
            <span>◎</span>Asia/Kolkata <b aria-hidden="true">⌄</b>
          </div>
          <div className="live-training-calendar-header">
            <strong>{months[monthIndex]}</strong>
            <div>
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setMonthIndex((value) => Math.max(0, value - 1))}
                disabled={monthIndex === 0}
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setMonthIndex((value) => Math.min(months.length - 1, value + 1))}
                disabled={monthIndex === months.length - 1}
              >
                ›
              </button>
            </div>
          </div>
          <div className="live-training-weekdays" aria-hidden="true">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="live-training-days" aria-label={`${months[monthIndex]} available dates`}>
            {days.map((day) => (
              <button
                type="button"
                key={day}
                aria-label={`${months[monthIndex]} ${day}`}
                aria-pressed={selectedDay === day}
                onClick={() => setSelectedDay(day)}
                className={selectedDay === day ? "is-selected" : ""}
              >
                {day}
                {day === 1 && monthIndex === 0 ? <i aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
          {selectedDay ? (
            <a className="marketing-button live-training-continue" href="/product-demo">
              Continue with {months[monthIndex]} {selectedDay} <span aria-hidden="true">→</span>
            </a>
          ) : (
            <p className="live-training-select-prompt">Select a date to reserve your spot.</p>
          )}
        </section>
      </section>
      <section className="live-training-trust" aria-label="Supademo trust signal">
        <p>Trusted by 200,000+ professionals and 3,000+ companies</p>
        <div>
          <span>SIEMENS</span>
          <span>TEALIUM</span>
          <span>PLAiD</span>
          <span>beehiiv</span>
        </div>
      </section>
      <section className="live-training-faq" aria-labelledby="live-training-faq-title">
        <h2 id="live-training-faq-title">FAQs</h2>
        {[
          "Who is the training for?",
          "What will we cover?",
          "Can I request a 1:1 demo instead?"
        ].map((question) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>
              Join the small-group session for practical guidance and live answers from a Supademo
              product expert.
            </p>
          </details>
        ))}
      </section>
      <MarketingFooter />
    </main>
  );
}
