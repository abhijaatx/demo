"use client";

import { useState } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

const sections = [
  ["commitment", "Our Commitment"],
  ["standards", "Standards & Guidelines"],
  ["testing", "Testing & Evaluation"],
  ["status", "Current Status"],
  ["vpat", "VPAT Documentation"],
  ["feedback", "Feedback & Contact"],
  ["formats", "Alternative Formats"]
] as const;

export function MarketingAccessibility() {
  const [activeSection, setActiveSection] = useState<(typeof sections)[number][0]>("commitment");

  function goToSection(id: (typeof sections)[number][0]) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="accessibility-page" id="main">
      <MarketingHeader />
      <section className="accessibility-intro" aria-labelledby="accessibility-title">
        <p className="accessibility-eyebrow">Accessibility</p>
        <h1 id="accessibility-title">Accessibility Statement</h1>
        <p>
          Supademo is committed to ensuring digital accessibility for people of all abilities. We
          are continually improving the user experience for everyone and applying relevant
          accessibility standards.
        </p>
        <p className="accessibility-updated">
          <strong>Last Updated:</strong> January 28, 2026
        </p>
      </section>
      <div className="accessibility-layout">
        <aside className="accessibility-sidebar" aria-label="On this page">
          <strong>On this page</strong>
          <nav>
            {sections.map(([id, label]) => (
              <button
                type="button"
                key={id}
                className={activeSection === id ? "is-active" : undefined}
                aria-current={activeSection === id ? "true" : undefined}
                onClick={() => goToSection(id)}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>
        <article className="accessibility-content">
          <section id="commitment">
            <h2>Our Commitment</h2>
            <p>
              At Supademo, we believe technology should be accessible to everyone. Our mission is to
              help teams create interactive demos that communicate effectively with all users,
              regardless of their abilities or assistive technologies.
            </p>
            <p>We are committed to:</p>
            <ul>
              <li>Ensuring our platform is perceivable, operable, understandable, and robust</li>
              <li>
                Continuously improving accessibility across all Supademo products and services
              </li>
              <li>Training our team on accessibility best practices and inclusive design</li>
              <li>Engaging with users with disabilities to understand their needs</li>
              <li>Making accessibility a core part of product development</li>
            </ul>
          </section>
          <section id="standards">
            <h2>Standards &amp; Guidelines</h2>
            <p>
              Supademo strives to conform to the{" "}
              <strong>Web Content Accessibility Guidelines (WCAG 2.1 Level AA)</strong> as our
              primary accessibility standard.
            </p>
            <p>Our accessibility efforts are also guided by:</p>
            <ul>
              <li>
                <strong>Section 508</strong> of the Rehabilitation Act (United States)
              </li>
              <li>
                <strong>EN 301 549</strong> European accessibility standard
              </li>
              <li>
                <strong>Accessible Canada Act</strong> requirements
              </li>
              <li>
                <strong>Americans with Disabilities Act</strong> guidelines
              </li>
            </ul>
            <p className="accessibility-note">
              <strong>Note:</strong> While we aim to meet WCAG 2.2 Level AA standards across all
              products, some third-party content or legacy features may not yet fully conform.
            </p>
          </section>
          <section id="testing">
            <h2>Testing &amp; Evaluation</h2>
            <p>
              We use a comprehensive approach to accessibility testing with both automated and
              manual evaluation.
            </p>
            <div className="accessibility-columns">
              <div>
                <h3>Automated Testing</h3>
                <ul>
                  <li>Accessibility linting in continuous integration</li>
                  <li>Automated WCAG compliance scans</li>
                  <li>Color contrast analysis</li>
                </ul>
              </div>
              <div>
                <h3>Manual Testing</h3>
                <ul>
                  <li>Keyboard-only navigation</li>
                  <li>NVDA, JAWS, and VoiceOver testing</li>
                  <li>Zoom, dictation, and reduced-motion testing</li>
                </ul>
              </div>
              <div>
                <h3>User Testing</h3>
                <ul>
                  <li>Usability testing with people with disabilities</li>
                  <li>Feedback from assistive-technology users</li>
                  <li>Third-party accessibility audits</li>
                </ul>
              </div>
            </div>
          </section>
          <section id="status">
            <h2>Current Status</h2>
            <p>
              We are actively working to ensure that our platform meets accessibility standards.
            </p>
            <div className="accessibility-status-card">
              <div>
                <span>Status</span>
                <strong>WCAG 2.2 AA</strong>
              </div>
              <div>
                <span>Target</span>
                <strong>WCAG 2.2 AA</strong>
              </div>
              <a href="/accessibility/vpat">View VPAT Documentation →</a>
            </div>
          </section>
          <section id="vpat">
            <h2>VPAT Documentation</h2>
            <p>
              We provide Voluntary Product Accessibility Templates (VPATs) to help organizations
              understand the accessibility conformance of our products.
            </p>
            <div className="accessibility-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Standard</th>
                    <th>Last Updated</th>
                    <th>Link</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Supademo Platform</td>
                    <td>WCAG 2.2 A/AA</td>
                    <td>January 28, 2026</td>
                    <td>
                      <a href="/accessibility/vpat">View VPAT</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              For enterprise customers requiring specific accessibility documentation, please{" "}
              <a href="/help">contact our team</a>.
            </p>
          </section>
          <section id="feedback">
            <h2>Feedback &amp; Contact</h2>
            <p>
              We welcome feedback on the accessibility of Supademo. If you encounter a barrier or
              have a suggestion, please let us know.
            </p>
            <h3>Contact Us</h3>
            <ul>
              <li>
                <strong>Email:</strong>{" "}
                <a href="mailto:accessibility@supademo.com">accessibility@supademo.com</a>
              </li>
              <li>
                <strong>Support:</strong> <a href="/help">Help Center</a>
              </li>
            </ul>
            <p>We aim to respond to accessibility feedback within 5 business days.</p>
          </section>
          <section id="formats">
            <h2>Alternative Formats</h2>
            <p>
              Upon request, we can provide information in formats that meet your accessibility
              needs:
            </p>
            <ul>
              <li>Large print versions of documentation</li>
              <li>Screen reader compatible formats</li>
              <li>Plain language summaries</li>
              <li>Audio descriptions where applicable</li>
            </ul>
            <p>
              To request an alternative format, contact{" "}
              <a href="mailto:accessibility@supademo.com">accessibility@supademo.com</a>.
            </p>
          </section>
        </article>
      </div>
      <MarketingFooter variant="showcase" />
    </main>
  );
}
