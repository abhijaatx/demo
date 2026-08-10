import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

const levelARows = [
  [
    "1.1.1 Non-text Content",
    "Supports",
    "Images include appropriate alternative text; decorative images are marked accordingly."
  ],
  [
    "1.2.1 Audio-only and Video-only (Prerecorded)",
    "Partially Supports",
    "Supademos provide transcripts; user-created video content may not include a text alternative."
  ],
  [
    "1.2.2 Captions (Prerecorded)",
    "Partially Supports",
    "Supademos support captions; user-created video content may not include captions."
  ],
  [
    "1.2.3 Audio Description or Media Alternative",
    "Partially Supports",
    "Supademos provide text alternatives for demo content."
  ],
  [
    "1.3.1 Info and Relationships",
    "Supports",
    "Semantic HTML, form labels, and ARIA landmarks define page regions."
  ],
  ["1.3.2 Meaningful Sequence", "Supports", "Content reading order supports a logical sequence."],
  [
    "1.3.3 Sensory Characteristics",
    "Supports",
    "The platform does not rely on sensory characteristics; hotspots are keyboard focusable."
  ],
  [
    "1.4.1 Use of Color",
    "Supports",
    "Visual indicators such as text and icons accompany color changes."
  ],
  ["1.4.2 Audio Control", "Supports", "Audio does not autoplay and users have playback control."],
  ["2.1.1 Keyboard", "Supports", "All interactive elements are keyboard accessible."],
  ["2.1.2 No Keyboard Trap", "Supports", "Keyboard trapping does not occur outside modal dialogs."],
  [
    "2.1.4 Character Key Shortcuts",
    "Supports",
    "Character-key shortcuts can be avoided or disabled where provided."
  ],
  [
    "2.4.1 Bypass Blocks",
    "Supports",
    "Skip links and semantic landmarks provide bypass mechanisms."
  ],
  ["2.4.2 Page Titled", "Supports", "Pages have descriptive titles."],
  ["2.4.3 Focus Order", "Supports", "Focus order preserves meaning and operability."],
  ["2.4.4 Link Purpose", "Supports", "Link purpose is determinable from link text or context."],
  [
    "2.5.1 Pointer Gestures",
    "Supports",
    "Functionality using multipoint gestures has a single-pointer alternative."
  ],
  ["2.5.2 Pointer Cancellation", "Supports", "Pointer actions can be cancelled before completion."],
  ["2.5.3 Label in Name", "Supports", "Accessible names contain the visible labels of controls."],
  [
    "2.5.4 Motion Actuation",
    "Supports",
    "Motion-based actions have conventional control alternatives."
  ],
  ["3.1.1 Language of Page", "Supports", "The page language is identified in the document."],
  ["3.2.1 On Focus", "Supports", "Receiving focus does not unexpectedly change context."],
  ["3.2.2 On Input", "Supports", "Changing a control does not unexpectedly change context."],
  ["3.3.1 Error Identification", "Supports", "Input errors are identified and described."],
  [
    "3.3.2 Labels or Instructions",
    "Supports",
    "Forms provide labels and instructions when input is required."
  ],
  ["4.1.1 Parsing", "Supports", "Markup is parsed according to current HTML standards."],
  ["4.1.2 Name, Role, Value", "Supports", "Controls expose accessible names, roles, and values."]
] as const;

const levelAARows = [
  ["1.2.4 Captions (Live)", "Not Applicable", "No live video content is supplied."],
  [
    "1.2.5 Audio Description (Prerecorded)",
    "Partially Supports",
    "Text alternatives are provided for visual content; user-created videos may not include audio description."
  ],
  ["1.3.4 Orientation", "Supports", "Content may be consumed from any orientation."],
  [
    "1.3.5 Identify Input Purpose",
    "Supports",
    "Input controls use appropriate autocomplete values."
  ],
  ["1.4.3 Contrast (Minimum)", "Supports", "Text meets minimum color contrast requirements."],
  ["1.4.4 Resize Text", "Supports", "Text-only resize up to 200% is supported."],
  ["1.4.5 Images of Text", "Supports", "Images are not used to supply text content."],
  [
    "1.4.10 Reflow",
    "Partially Supports",
    "Some editor views and pages may overflow at narrow widths."
  ],
  ["1.4.11 Non-text Contrast", "Supports", "UI components meet minimum contrast requirements."],
  [
    "1.4.12 Text Spacing",
    "Supports",
    "No loss of content or functionality occurs when text spacing is adjusted."
  ],
  [
    "1.4.13 Content on Hover or Focus",
    "Supports",
    "Revealed content is dismissible and persistent."
  ],
  ["2.4.5 Multiple Ways", "Supports", "Navigation and search provide multiple ways to find pages."],
  ["2.4.6 Headings and Labels", "Supports", "Headings and labels are descriptive."],
  ["2.4.7 Focus Visible", "Supports", "Keyboard focus indicators are visible by default."],
  [
    "2.4.11 Focus Not Obscured (Minimum)",
    "Supports",
    "Focused elements are not entirely hidden by other content."
  ],
  ["2.5.7 Dragging Movements", "Supports", "Drag operations have keyboard alternatives."],
  [
    "2.5.8 Target Size (Minimum)",
    "Partially Supports",
    "Most targets meet the 24 by 24 CSS pixel minimum; some smaller targets have adequate spacing."
  ],
  ["3.1.2 Language of Parts", "Supports", "Language changes are identified when they occur."],
  [
    "3.2.3 Consistent Navigation",
    "Supports",
    "Repeated navigation mechanisms appear in a consistent order."
  ],
  [
    "3.2.4 Consistent Identification",
    "Supports",
    "Components with the same function are identified consistently."
  ],
  ["3.3.3 Error Suggestion", "Supports", "Known input corrections are suggested when practical."],
  [
    "3.3.4 Error Prevention (Legal, Financial, Data)",
    "Supports",
    "Submissions can be reviewed and corrected before completion."
  ],
  [
    "4.1.3 Status Messages",
    "Supports",
    "Status messages are exposed to assistive technology without moving focus."
  ]
] as const;

const navSections = [
  ["product-info", "Product Information"],
  ["applicable-standards", "Applicable Standards/Guidelines"],
  ["terms", "Terms"],
  ["wcag-2-2-a", "WCAG 2.2 Level A"],
  ["wcag-2-2-aa", "WCAG 2.2 Level AA"],
  ["legal-disclaimer", "Legal Disclaimer"]
] as const;

function ConformanceTable({ rows }: { rows: readonly (readonly [string, string, string])[] }) {
  return (
    <div className="vpat-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Criteria</th>
            <th>Conformance Level</th>
            <th>Remarks and Explanations</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([criteria, level, remarks]) => (
            <tr key={criteria}>
              <td>{criteria}</td>
              <td>
                <span
                  className={`vpat-level vpat-level-${level.toLowerCase().replaceAll(" ", "-")}`}
                >
                  {level}
                </span>
              </td>
              <td>{remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MarketingVpat() {
  return (
    <main className="vpat-page" id="main">
      <MarketingHeader />
      <header className="vpat-intro" aria-labelledby="vpat-title">
        <p className="vpat-eyebrow">Accessibility</p>
        <h1 id="vpat-title">Supademo Accessibility Conformance Report</h1>
        <p>VPAT® Version 2.5Rev · WCAG 2.2 Level A &amp; AA</p>
        <p className="vpat-updated">
          <strong>Report Date:</strong> January 28, 2026
        </p>
      </header>
      <div className="vpat-layout">
        <aside className="vpat-sidebar" aria-label="On this page">
          <strong>On this page</strong>
          <nav>
            {navSections.map(([id, label]) => (
              <a href={`#${id}`} key={id}>
                {label}
              </a>
            ))}
          </nav>
        </aside>
        <article className="vpat-content">
          <section id="product-info">
            <h2>Product Information</h2>
            <dl className="vpat-product-grid">
              <div>
                <dt>Product Name</dt>
                <dd>Supademo Platform</dd>
              </div>
              <div>
                <dt>Report Date</dt>
                <dd>January 28, 2026</dd>
              </div>
              <div>
                <dt>Product Description</dt>
                <dd>
                  Supademo is an interactive demo creation platform that enables teams to create,
                  share, and analyze product demos. This report covers the web application, demo
                  editor, demo player, and public demo viewing experience.
                </dd>
              </div>
              <div>
                <dt>Contact Information</dt>
                <dd>
                  <a href="mailto:accessibility@supademo.com">accessibility@supademo.com</a>
                </dd>
              </div>
              <div>
                <dt>VPAT Version</dt>
                <dd>2.5Rev</dd>
              </div>
              <div>
                <dt>Evaluation Methods</dt>
                <dd>
                  Manual keyboard navigation, VoiceOver, automated WAVE and Axe scans, DOM and ARIA
                  verification, and target-size measurements.
                </dd>
              </div>
            </dl>
          </section>
          <section id="applicable-standards">
            <h2>Applicable Standards/Guidelines</h2>
            <p>
              This report covers the degree of conformance for the following accessibility standard
              and guidelines.
            </p>
            <div className="vpat-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Standard/Guideline</th>
                    <th>Included in Report</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Web Content Accessibility Guidelines 2.2</td>
                    <td>
                      Level A — Yes
                      <br />
                      Level AA — Yes
                      <br />
                      Level AAA — No
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section id="terms">
            <h2>Terms</h2>
            <p>The terms used in the Conformance Level information are defined as follows:</p>
            <div className="vpat-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Definition</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [
                      "Supports",
                      "The functionality has at least one method that meets the criterion without known defects or meets with equivalent facilitation."
                    ],
                    ["Partially Supports", "Some functionality does not meet the criterion."],
                    [
                      "Does Not Support",
                      "The majority of product functionality does not meet the criterion."
                    ],
                    ["Not Applicable", "The criterion is not relevant to the product."]
                  ].map(([term, definition]) => (
                    <tr key={term}>
                      <td>{term}</td>
                      <td>{definition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section id="wcag-2-2-a">
            <h2>WCAG 2.2 Level A</h2>
            <p>
              When reporting on conformance with the WCAG 2.x Success Criteria, the criteria are
              scoped for full pages, complete processes, and accessibility-supported ways of using
              technology.
            </p>
            <h3>Table 1: Success Criteria, Level A</h3>
            <ConformanceTable rows={levelARows} />
          </section>
          <section id="wcag-2-2-aa">
            <h2>WCAG 2.2 Level AA</h2>
            <h3>Table 2: Success Criteria, Level AA</h3>
            <ConformanceTable rows={levelAARows} />
          </section>
          <section id="legal-disclaimer">
            <h2>Legal Disclaimer</h2>
            <p>
              This document is provided for informational purposes only and is not legal advice. It
              assists in making preliminary assessments regarding accessibility features and may be
              changed without prior notice.
            </p>
            <p>
              This report is based on the ITI VPAT® Version 2.5Rev. VPAT® is a registered trademark
              of the Information Technology Industry Council (ITI).
            </p>
          </section>
        </article>
      </div>
      <MarketingFooter variant="showcase" />
    </main>
  );
}
