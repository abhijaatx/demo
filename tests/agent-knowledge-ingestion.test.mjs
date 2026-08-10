import assert from "node:assert/strict";
import { test } from "node:test";
import { createKnowledgeSourceRecord } from "@supademo/domain";

test("createKnowledgeSourceRecord validates target URLs against SSRF vulnerabilities", () => {
  const fileSource = createKnowledgeSourceRecord(
    "src-1",
    "ag-1",
    "ws-1",
    "file",
    "/docs/guide.pdf"
  );
  assert.equal(fileSource.sourceId, "src-1");
  assert.equal(fileSource.status, "pending");

  const validUrlSource = createKnowledgeSourceRecord(
    "src-2",
    "ag-1",
    "ws-1",
    "url",
    "https://docs.acme.com/faq"
  );
  assert.equal(validUrlSource.contentUrlOrPath, "https://docs.acme.com/faq");

  assert.throws(
    () =>
      createKnowledgeSourceRecord(
        "src-3",
        "ag-1",
        "ws-1",
        "url",
        "http://169.254.169.254/latest/meta-data/"
      ),
    /SSRF blocked knowledge source URL/
  );
});
