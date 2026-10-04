#!/usr/bin/env node
/**
 * Smoke-test the configured CONTENT_AI_* OpenAI-compatible endpoint
 * (typically local FreeLLMAPI at http://127.0.0.1:3001/v1).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnv(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv(resolve(process.cwd(), ".env"));

const baseURL = (process.env.CONTENT_AI_BASE_URL ?? "").replace(/\/+$/, "");
const apiKey = (process.env.CONTENT_AI_API_KEY ?? "").trim();
const model = (process.env.CONTENT_AI_MODEL ?? "auto:cheap").trim();

if (!baseURL) {
  console.error("CONTENT_AI_BASE_URL is not set. Run: pnpm llm:setup");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
};

const modelsUrl = `${baseURL}/models?execution_status=ready`;
const modelsRes = await fetch(modelsUrl, { headers });
if (!modelsRes.ok) {
  console.error(`GET ${modelsUrl} → ${modelsRes.status} ${await modelsRes.text()}`);
  process.exit(1);
}

const modelsJson = await modelsRes.json();
const readyCount = Array.isArray(modelsJson?.data) ? modelsJson.data.length : 0;
console.log(`Models ready: ${readyCount} (${modelsUrl})`);

const chatRes = await fetch(`${baseURL}/chat/completions`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    model,
    messages: [
      {
        role: "user",
        content: 'Reply with exactly: {"ok":true}',
      },
    ],
    temperature: 0,
    max_tokens: 32,
  }),
});

const routedVia = chatRes.headers.get("x-routed-via");
const bodyText = await chatRes.text();
if (!chatRes.ok) {
  console.error(`chat/completions → ${chatRes.status}`);
  console.error(bodyText);
  process.exit(1);
}

let content = "";
try {
  const json = JSON.parse(bodyText);
  content = json?.choices?.[0]?.message?.content ?? "";
} catch {
  content = bodyText;
}

console.log(`Chat OK via model=${model}${routedVia ? ` routed=${routedVia}` : ""}`);
console.log(`Reply: ${String(content).slice(0, 200)}`);
console.log("FreeLLMAPI / content AI smoke test passed.");
