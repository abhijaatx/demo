import assert from "node:assert/strict";
import { test } from "node:test";
import { executeAiTranslationJob } from "@supademo/domain";

test("executeAiTranslationJob processes translation jobs for key-value maps", async () => {
  const sources = { step1: "Welcome {{ name }}", step2: "Click Next" };
  const job = await executeAiTranslationJob(sources, "en-US", "es-ES");

  assert.equal(job.status, "completed");
  assert.equal(job.sourceLocale, "en-US");
  assert.equal(job.targetLocale, "es-ES");
  assert.equal(typeof job.translatedTexts["step1"], "string");
});
