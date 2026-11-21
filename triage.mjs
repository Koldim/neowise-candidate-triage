import { classify } from "./mock-ai.mjs";

const TOPICS = new Set(["delivery", "pricing", "other"]);
const MODEL_TIMEOUT_MS = 300;

export class InvalidInput extends Error {}

export async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

export function parseText(rawBody) {
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    throw new InvalidInput();
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new InvalidInput();
  }
  const { text } = body;
  if (typeof text !== "string" || text.trim() === "") {
    throw new InvalidInput();
  }
  return text;
}

function manualReview() {
  return { status: "manual_review", topic: null, draft: null };
}

export async function triageText(text) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
  try {
    const raw = await classify(text, { signal: controller.signal });
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return manualReview();
    }
    const { topic, draft } = parsed ?? {};
    if (!TOPICS.has(topic) || typeof draft !== "string" || draft.trim() === "") {
      return manualReview();
    }
    return { status: "ready", topic, draft };
  } catch {
    return manualReview();
  } finally {
    clearTimeout(timer);
  }
}
