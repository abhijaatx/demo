"use client";

import { useState } from "react";

const features = [
  {
    title: "Smart Recording",
    description:
      "Record your screen and camera together in up to 4K, with a resizable webcam bubble you can position anywhere on screen.",
    bullets: [
      "One-click screen + webcam recording in up to 4K",
      "Resize and reposition the talking-head bubble freely"
    ],
    image: "https://supademo.com/features/screen-recorder/record-feature-1.avif",
    alt: "Smart Recording"
  },
  {
    title: "Free Editing",
    description:
      "Trim, cut, crop, mute, and adjust playback speed, all included free. No paid upgrade and no separate editor to buy.",
    bullets: [
      "Easy cropping, trimming, and muting",
      "Playback speed controls and thumbnails",
      "No paid plan required to edit"
    ],
    image: "https://supademo.com/features/screen-recorder/record-feature-2.avif",
    alt: "Free Editing"
  },
  {
    title: "Trackable Sharing",
    description:
      "Share as trackable links, download in multiple formats, or convert directly to interactive Supademos.",
    bullets: [
      "Share trackable links",
      "Download in multiple formats",
      "Convert recordings to Supademos"
    ],
    image: "https://supademo.com/features/screen-recorder/record-feature-3.avif",
    alt: "Trackable Sharing"
  },
  {
    title: "Add Interactive Elements",
    description:
      "When you want to go further, turn any recording into a guided, interactive demo, something a plain screen recorder can't do.",
    bullets: ["Guided hotspots", "Interactive chapters", "Viewer analytics"],
    image: "https://supademo.com/features/screen-recorder/record-feature-4.avif",
    alt: "Add Interactive Elements"
  }
] as const;

export function ScreenRecorderFeatureCarousel() {
  const [active, setActive] = useState(0);
  const feature = features[active];

  return (
    <div className="screen-recorder-feature-carousel" aria-label="Screen recorder features">
      <div className="screen-recorder-feature-card">
        <div className="screen-recorder-feature-copy">
          <h3>{feature.title}</h3>
          <p>{feature.description}</p>
          <ul>
            {feature.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
        <div className="screen-recorder-feature-media">
          <img src={feature.image} alt={feature.alt} loading="lazy" referrerPolicy="no-referrer" />
        </div>
      </div>
      <div
        className="screen-recorder-feature-tabs"
        role="tablist"
        aria-label="Recorder capabilities"
      >
        {features.map((item, index) => (
          <button
            key={item.title}
            type="button"
            role="tab"
            aria-selected={active === index}
            className={active === index ? "is-active" : undefined}
            onClick={() => setActive(index)}
          >
            {item.title}
          </button>
        ))}
      </div>
    </div>
  );
}
