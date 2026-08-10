import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hashChapterPassword,
  parseChapterPasswordProtection,
  parseDemoChapter,
  sanitizeEmbedUrl,
  verifyChapterPassword
} from "@supademo/domain";

test("parseDemoChapter normalizes chapter types and validates safe URLs", () => {
  const chapter = parseDemoChapter({
    type: "intro",
    title: "Welcome to Product Demo",
    bodyText: "Learn how to get started.",
    buttons: [
      { label: "Start Walkthrough", actionType: "next" },
      { label: "Malicious Link", actionType: "url", url: "javascript:alert(1)" }
    ]
  });

  assert.equal(chapter.type, "intro");
  assert.equal(chapter.title, "Welcome to Product Demo");
  assert.equal(chapter.buttons.length, 2);
  assert.equal(chapter.buttons[0].actionType, "next");
  assert.equal(chapter.buttons[1].actionType, "next");
  assert.equal(chapter.buttons[1].url, null); // rejected javascript: URL
  assert.equal(chapter.mediaUrl, null);
});

test("parseDemoChapter bounds untrusted content and accepts safe chapter media", () => {
  const chapter = parseDemoChapter({
    title: "x".repeat(500),
    bodyText: "y".repeat(10_000),
    mediaUrl: "https://cdn.example.com/chapter.png",
    buttons: Array.from({ length: 30 }, (_, index) => ({
      id: `button-${index}`,
      label: "z".repeat(300),
      actionType: "url",
      url: "https://example.com/next"
    }))
  });

  assert.equal(chapter.title.length, 160);
  assert.equal(chapter.bodyText.length, 4_000);
  assert.equal(chapter.mediaUrl, "https://cdn.example.com/chapter.png");
  assert.equal(chapter.buttons.length, 12);
  assert.equal(chapter.buttons[0].label.length, 96);
});

test("parseDemoChapter applies backwards-compatible visual defaults", () => {
  const chapter = parseDemoChapter({ type: "cta", title: "Visual defaults" });

  assert.equal(chapter.layout, "center");
  assert.equal(chapter.theme, "light");
  assert.equal(chapter.backgroundColor, null);
  assert.equal(chapter.opacity, 1);
  assert.equal(chapter.blurPx, 0);
});

test("parseDemoChapter accepts valid chapter visual fields", () => {
  const chapter = parseDemoChapter({
    type: "cta",
    title: "Visuals",
    layout: "right",
    theme: "custom",
    backgroundColor: "#123456",
    opacity: 0.5,
    blurPx: 8
  });

  assert.equal(chapter.layout, "right");
  assert.equal(chapter.theme, "custom");
  assert.equal(chapter.backgroundColor, "#123456");
  assert.equal(chapter.opacity, 0.5);
  assert.equal(chapter.blurPx, 8);
});

test("parseDemoChapter rejects malformed visual enums, unsafe colors, and clamps ranges", () => {
  const chapter = parseDemoChapter({
    type: "cta",
    title: "Malformed visuals",
    layout: "diagonal",
    theme: "neon",
    backgroundColor: "url(javascript:alert(1))",
    opacity: -5,
    blurPx: 500
  });

  assert.equal(chapter.layout, "center");
  assert.equal(chapter.theme, "light");
  assert.equal(chapter.backgroundColor, null);
  assert.equal(chapter.opacity, 0.2);
  assert.equal(chapter.blurPx, 24);

  const hugeOpacity = parseDemoChapter({
    type: "cta",
    title: "Clamped opacity",
    opacity: 9,
    blurPx: -40
  });
  assert.equal(hugeOpacity.opacity, 1);
  assert.equal(hugeOpacity.blurPx, 0);
});

test("parseDemoChapter rejects CSS-injection colors and non-string opacity values", () => {
  const chapter = parseDemoChapter({
    type: "cta",
    title: "Color injection",
    backgroundColor: "#ffffff;background-image:url(https://evil.example/x.png)",
    opacity: "0.5",
    blurPx: "8px"
  });

  assert.equal(chapter.backgroundColor, null);
  assert.equal(chapter.opacity, 1);
  assert.equal(chapter.blurPx, 0);
});

test("parseDemoChapter defaults chapter voiceover to null when absent", () => {
  const chapter = parseDemoChapter({ type: "intro", title: "No voiceover" });
  assert.equal(chapter.voiceover, null);
});

test("parseDemoChapter supports optional chapter voiceovers with bounded narration", () => {
  const chapter = parseDemoChapter({
    type: "cta",
    title: "Voiceover chapter",
    voiceover: {
      assetId: "chapter-voice",
      audioUrl: "https://cdn.supademo.com/audio/chapter.mp3",
      transcriptText: "x".repeat(5_000),
      source: "ai",
      speed: 9,
      stability: -1,
      durationSeconds: -5
    }
  });

  assert.ok(chapter.voiceover);
  assert.equal(chapter.voiceover?.audioUrl, "https://cdn.supademo.com/audio/chapter.mp3");
  assert.equal(chapter.voiceover?.transcriptText?.length, 4_000);
  assert.equal(chapter.voiceover?.source, "ai");
  assert.equal(chapter.voiceover?.speed, 2);
  assert.equal(chapter.voiceover?.stability, 0);
  assert.equal(chapter.voiceover?.durationSeconds, 0);
});

test("parseDemoChapter accepts blob chapter voiceover URLs and rejects unsafe ones", () => {
  const blobChapter = parseDemoChapter({
    type: "outro",
    title: "Blob voiceover",
    voiceover: { audioUrl: "blob:https://example.com/abc-123" }
  });
  assert.equal(blobChapter.voiceover?.audioUrl, "blob:https://example.com/abc-123");

  const unsafeChapter = parseDemoChapter({
    type: "intro",
    title: "Unsafe voiceover",
    voiceover: {
      audioUrl: "javascript:alert(1)",
      transcriptText: "hello",
      source: "unknown-source"
    }
  });
  assert.ok(unsafeChapter.voiceover);
  assert.equal(unsafeChapter.voiceover?.audioUrl, null);
  assert.equal(unsafeChapter.voiceover?.source, "manual");
});

test("parseDemoChapter supports bounded native Forms chapters", () => {
  const chapter = parseDemoChapter({
    id: "form-chapter",
    type: "form",
    title: "Tell us about your team",
    form: {
      formId: "lead-form",
      title: "Lead capture",
      fields: [
        { id: "email", label: "Work email", fieldType: "email", isRequired: true },
        { id: "role", label: "Role", fieldType: "select", options: ["Product", "Sales"] }
      ],
      allowSkip: false,
      allowNonBusinessEmails: false,
      backgroundImageUrl: "javascript:alert(1)"
    }
  });
  assert.equal(chapter.type, "form");
  assert.equal(chapter.form?.fields.length, 2);
  assert.equal(chapter.form?.backgroundImageUrl, null);
});

const VALID_PBKDF2_HASH = `pbkdf2-sha256$100000$${"0".repeat(32)}$${"1".repeat(64)}`;

test("parseDemoChapter parses bounded password protection for gate chapters", () => {
  const chapter = parseDemoChapter({
    type: "gate",
    title: "Protected",
    passwordProtection: {
      passwordHash: VALID_PBKDF2_HASH,
      buttonText: "x".repeat(300),
      backgroundColor: "#112233",
      textColor: "javascript:alert(1)"
    }
  });

  assert.equal(chapter.type, "gate");
  assert.equal(chapter.passwordProtection?.passwordHash, VALID_PBKDF2_HASH);
  assert.equal(chapter.passwordProtection?.buttonText.length, 96);
  assert.equal(chapter.passwordProtection?.backgroundColor, "#112233");
  assert.equal(chapter.passwordProtection?.textColor, null);
});

test("parseDemoChapter fails closed on malformed password protection and keeps legacy chapters open", () => {
  // A gate with a malformed or over-iterated hash stays locked: the hash is
  // null so no input can ever match, but the gate object itself remains.
  const unsafeHash = parseChapterPasswordProtection({
    passwordHash: "javascript:alert(1)",
    buttonText: "Go"
  });
  assert.equal(unsafeHash?.passwordHash, null);
  assert.equal(unsafeHash?.buttonText, "Go");

  const wrongFormat = parseChapterPasswordProtection({
    passwordHash: "a".repeat(100),
    buttonText: "Go"
  });
  assert.equal(wrongFormat?.passwordHash, null);

  // Iterations above the CPU-cost cap are rejected (fail closed, DoS guard).
  const overIterated = parseChapterPasswordProtection({
    passwordHash: `pbkdf2-sha256$999999999$${"0".repeat(32)}$${"1".repeat(64)}`,
    buttonText: "Go"
  });
  assert.equal(overIterated?.passwordHash, null);

  // Iterations below the floor are rejected so hand-crafted documents cannot
  // publish trivially weak gates.
  const underIterated = parseChapterPasswordProtection({
    passwordHash: `pbkdf2-sha256$1$${"0".repeat(32)}$${"1".repeat(64)}`,
    buttonText: "Go"
  });
  assert.equal(underIterated?.passwordHash, null);

  const missing = parseChapterPasswordProtection(null);
  assert.equal(missing, null);

  // A gate chapter without protection settings is a plain chapter (legacy).
  const legacyGate = parseDemoChapter({ type: "gate", title: "Legacy gate" });
  assert.equal(legacyGate.type, "gate");
  assert.equal(legacyGate.passwordProtection, null);
});

test("password protection on a non-gate chapter is ignored, never gating it", () => {
  const formChapter = parseDemoChapter({
    type: "form",
    title: "Lead form",
    passwordProtection: {
      passwordHash: VALID_PBKDF2_HASH,
      buttonText: "Unlock"
    }
  });
  assert.equal(formChapter.type, "form");
  assert.equal(formChapter.passwordProtection, null);

  const ctaChapter = parseDemoChapter({
    type: "cta",
    title: "Call to action",
    passwordProtection: { passwordHash: "malformed", buttonText: "Unlock" }
  });
  assert.equal(ctaChapter.passwordProtection, null);
});

test("hashChapterPassword is a salted PBKDF2 digest and never leaks plaintext", async () => {
  const digest = await hashChapterPassword("  s3cret!  ");
  assert.match(digest, /^pbkdf2-sha256\$\d+\$[0-9a-f]{32}\$[0-9a-f]{64}$/u);
  // Random salt: two hashes of the same password differ.
  assert.notEqual(digest, await hashChapterPassword("s3cret!"));
  assert.notEqual(digest, await hashChapterPassword("s3cret!2"));
  assert.ok(!digest.includes("s3cret"));

  const verified = await verifyChapterPassword("s3cret!", digest);
  assert.equal(verified, true);
  const wrong = await verifyChapterPassword("wrong", digest);
  assert.equal(wrong, false);
  const noHash = await verifyChapterPassword("anything", null);
  assert.equal(noHash, false);
  const malformed = await verifyChapterPassword("s3cret!", "not-a-valid-hash");
  assert.equal(malformed, false);
  // Over-iterated stored hashes never verify (CPU DoS guard).
  const overIterated = await verifyChapterPassword(
    "s3cret!",
    `pbkdf2-sha256$999999999$${"0".repeat(32)}$${"1".repeat(64)}`
  );
  assert.equal(overIterated, false);
  // Under-iterated stored hashes never verify either.
  const underIterated = await verifyChapterPassword(
    "s3cret!",
    `pbkdf2-sha256$1$${"0".repeat(32)}$${"1".repeat(64)}`
  );
  assert.equal(underIterated, false);
});

test("parseDemoChapter supports embed chapters with normalized public HTTPS URLs", () => {
  const chapter = parseDemoChapter({
    type: "embed",
    title: "Book a meeting",
    embedUrl: "  https://calendly.com/team/meeting?month=2026-08#booking  "
  });
  assert.equal(chapter.type, "embed");
  assert.equal(chapter.embedUrl, "https://calendly.com/team/meeting?month=2026-08");
  assert.equal(chapter.title, "Book a meeting");
  assert.deepEqual(chapter.buttons, []);
});

test("parseDemoChapter rejects unsafe, malformed, private, and overlong embed URLs", () => {
  const unsafe = [
    "javascript:alert(1)",
    "data:text/html,<script>1</script>",
    "vbscript:msgbox(1)",
    "http://example.com/form",
    "https://user:pass@example.com/form",
    "https://localhost/form",
    "https://127.0.0.1/form",
    "https://127.1/form",
    "https://0x7f000001/form",
    "https://0.0.0.0/form",
    "https://10.0.0.8/form",
    "https://172.16.0.2/form",
    "https://172.31.255.254/form",
    "https://192.168.1.10/form",
    "https://169.254.169.254/latest/meta-data",
    "https://[::]/form",
    "https://[::1]/form",
    "https://[fd00::1]/form",
    "https://[fe80::1]/form",
    "https://[::ffff:127.0.0.1]/form",
    "not a url",
    "https://exa mple.com/form",
    "https://calendly.com/team/meeting?" + "x".repeat(2048)
  ];
  for (const value of unsafe) {
    const chapter = parseDemoChapter({ type: "embed", title: "Embed", embedUrl: value });
    assert.equal(
      chapter.embedUrl,
      null,
      "expected unsafe or overlong embed URL to be rejected: " + JSON.stringify(value.slice(0, 48))
    );
  }
});

test("parseDemoChapter ignores embedUrl on non-embed chapters and keeps legacy defaults", () => {
  const cta = parseDemoChapter({
    type: "cta",
    title: "CTA",
    embedUrl: "https://calendly.com/team/meeting"
  });
  assert.equal(cta.embedUrl, null);
  const legacy = parseDemoChapter({ type: "intro", title: "Legacy" });
  assert.equal(legacy.embedUrl, null);
});

test("sanitizeEmbedUrl rejects overlong values instead of truncating them", () => {
  const overlong = "https://calendly.com/team/meeting?" + "x".repeat(2048);
  assert.equal(sanitizeEmbedUrl(overlong), null);
  const valid = sanitizeEmbedUrl("  https://tally.so/r/example#form  ");
  assert.equal(valid, "https://tally.so/r/example");
  assert.equal(sanitizeEmbedUrl(null), null);
  assert.equal(sanitizeEmbedUrl(""), null);
  assert.equal(sanitizeEmbedUrl(42), null);
});

test("sanitizeEmbedUrl accepts public hostnames that share ULA prefixes", () => {
  // The IPv6 fc/fd/fe80 private checks only apply to hosts that actually
  // contain ":", so public hostnames like fda.gov are never rejected.
  assert.equal(sanitizeEmbedUrl("https://fda.gov/form"), "https://fda.gov/form");
  assert.equal(sanitizeEmbedUrl("https://fc2.com/form"), "https://fc2.com/form");
  const chapter = parseDemoChapter({
    type: "embed",
    title: "Public host",
    embedUrl: "https://fda.gov/form"
  });
  assert.equal(chapter.embedUrl, "https://fda.gov/form");
});
