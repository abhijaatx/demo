import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createFormField,
  createDemoFormSchema,
  normalizeEmailDomainList,
  parseDemoFormSchema,
  FORM_FIELD_LIMIT
} from "@supademo/domain";

test("createFormField & createDemoFormSchema create validated frozen form schemas", () => {
  const f1 = createFormField("email", "Work Email", "email", true);
  const f2 = createFormField("role", "Role", "select", false, ["Engineering", "Product"]);

  const schema = createDemoFormSchema("form-1", "Lead Capture", [f1, f2]);

  assert.equal(schema.formId, "form-1");
  assert.equal(schema.fields.length, 2);
  assert.equal(schema.fields[0].fieldType, "email");
  assert.equal(schema.fields[1].options.length, 2);
  assert.equal(schema.allowSkip, false);
  assert.equal(schema.layout, "center");
});

test("form schemas bound fields, options, appearance, and unsafe image URLs", () => {
  const fields = Array.from({ length: 12 }, (_, index) =>
    createFormField(`f-${index}`, `Field ${index}`, "select", false, ["A", "B"])
  );
  const schema = createDemoFormSchema("form-bounded", "Lead capture", fields, {
    allowSkip: true,
    allowNonBusinessEmails: true,
    layout: "right",
    theme: "custom",
    backgroundColor: "#112233",
    backgroundImageUrl: "javascript:alert(1)",
    opacity: 4,
    blurPx: 100
  });

  assert.equal(schema.fields.length, FORM_FIELD_LIMIT);
  assert.equal(schema.backgroundImageUrl, null);
  assert.equal(schema.opacity, 1);
  assert.equal(schema.blurPx, 24);
  assert.equal(schema.allowSkip, true);
  assert.equal(schema.allowNonBusinessEmails, true);
});

test("parseDemoFormSchema fails closed for malformed form IDs and sanitizes fields", () => {
  const parsed = parseDemoFormSchema({
    formId: "form-parse",
    title: "Captured form",
    fields: [
      { id: "email", label: "Email", fieldType: "email", isRequired: true },
      { id: "choice", label: "Choice", fieldType: "select", options: ["A", "B", "C"] }
    ],
    backgroundImageUrl: "data:text/html,<script>alert(1)</script>",
    layout: "left"
  });
  assert.equal(parsed?.fields.length, 2);
  assert.equal(parsed?.backgroundImageUrl, null);
  assert.equal(parsed?.layout, "left");
  assert.equal(parseDemoFormSchema({ formId: "", title: "Broken", fields: [] }), null);
});

test("createDemoFormSchema normalizes allowed and blocked email domains", () => {
  const schema = createDemoFormSchema("form-domains", "Lead capture", [], {
    allowedEmailDomains: [" Acme.COM ", "acme.io", "https://evil.com", "javascript:alert(1)"],
    blockedEmailDomains: ["spam.com", "SpamMail.com"]
  });

  // Lowercased, trimmed, deduplicated; unsafe/malformed tokens dropped.
  assert.deepEqual(schema.allowedEmailDomains, ["acme.com", "acme.io"]);
  assert.deepEqual(schema.blockedEmailDomains, ["spam.com", "spammail.com"]);
});

test("normalizeEmailDomainList rejects unsafe and malformed domain tokens", () => {
  const malicious = [
    "https://evil.com",
    "javascript:alert(1)",
    "evil.com/path",
    "user@evil.com",
    "*.wild.com",
    "a b.com",
    "192.168.1.1",
    "10.0.0.1",
    "localhost",
    "local",
    "evil.com.",
    "..double..",
    "-leading.com",
    "trailing-.com",
    ""
  ];
  const result = normalizeEmailDomainList(malicious.join(","));
  assert.deepEqual(result, []);
});

test("normalizeEmailDomainList accepts valid plain DNS hostnames and caps counts and length", () => {
  const valid = ["acme.com", "sub.acme.com", "a-b.example.io"];
  const result = normalizeEmailDomainList(valid.join(","));
  assert.deepEqual(result, valid);

  // Count cap.
  const tooMany = Array.from({ length: 40 }, (_, index) => `domain${index}.com`);
  const capped = normalizeEmailDomainList(tooMany.join(","));
  assert.equal(capped.length, 25);

  // Length cap: an oversized label and a very long token are dropped.
  const oversized = `${"a".repeat(64)}.com, ${"x".repeat(260)}`;
  const bounded = normalizeEmailDomainList(oversized);
  assert.deepEqual(bounded, []);

  // Deduplication.
  const deduped = normalizeEmailDomainList(["acme.com", "Acme.com", "acme.com"]);
  assert.deepEqual(deduped, ["acme.com"]);
});

test("normalizeEmailDomainList drops valid-looking hostnames longer than 253 chars", () => {
  // Five 63-char labels are each valid and the syntax is legal DNS; only the
  // total length (319 chars) must reject the token — never truncate it.
  // (Under truncation this token would become a valid 253-char hostname, so
  // this regression proves oversized original tokens are dropped, not sliced.)
  const oversized = `${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(63)}.${"e".repeat(63)}`;
  assert.ok(oversized.length > 253);
  assert.deepEqual(normalizeEmailDomainList([oversized]), []);
});

test("normalizeEmailDomainList caps a requested maximum at the canonical bound", () => {
  const many = Array.from({ length: 40 }, (_, index) => `domain${index}.com`);

  // A requested maximum above the canonical count cannot bypass the cap.
  assert.equal(normalizeEmailDomainList(many, 100).length, 25);
  // Malformed and negative maxima fall back or clamp safely.
  assert.equal(normalizeEmailDomainList(many, -5).length, 0);
  assert.equal(normalizeEmailDomainList(many, Number.NaN).length, 25);
  assert.equal(normalizeEmailDomainList(many, "50").length, 25);
});

test("parseDemoFormSchema reads domain lists and stays backwards compatible when absent", () => {
  const withDomains = parseDemoFormSchema({
    formId: "form-parse-domains",
    title: "Lead",
    fields: [],
    allowedEmailDomains: ["acme.com", "javascript:alert(1)"],
    blockedEmailDomains: "spam.com, https://evil.com"
  });
  assert.deepEqual(withDomains?.allowedEmailDomains, ["acme.com"]);
  assert.deepEqual(withDomains?.blockedEmailDomains, ["spam.com"]);

  const withoutDomains = parseDemoFormSchema({
    formId: "form-legacy",
    title: "Legacy",
    fields: []
  });
  assert.deepEqual(withoutDomains?.allowedEmailDomains, []);
  assert.deepEqual(withoutDomains?.blockedEmailDomains, []);
});
