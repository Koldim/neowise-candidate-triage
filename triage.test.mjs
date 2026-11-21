import assert from "node:assert/strict";
import { test } from "node:test";
import { InvalidInput, parseText, triageText } from "./triage.mjs";

test("empty input is invalid", () => {
  assert.throws(() => parseText("{}"), InvalidInput);
  assert.throws(() => parseText(JSON.stringify({ text: "  " })), InvalidInput);
  assert.throws(() => parseText("{"), InvalidInput);
});

test("model failure becomes manual_review", async () => {
  for (const text of ["[timeout]", "[error]", "[bad-json]", "[bad-topic]", "[empty-draft]"]) {
    assert.deepEqual(await triageText(text), {
      status: "manual_review",
      topic: null,
      draft: null,
    });
  }
});

test("valid model response is ready", async () => {
  const result = await triageText("Вопрос по доставке заказа");
  assert.equal(result.status, "ready");
  assert.equal(result.topic, "delivery");
  assert.equal(typeof result.draft, "string");
  assert.ok(result.draft.trim());
});
