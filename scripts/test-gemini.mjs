/**
 * test-gemini.mjs — 후보 모델별 단일요청 진단 (키 노출 없음)
 * 어떤 모델이 지금 당장 무료로 응답하는지 확인
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const raw = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
const KEY = env.GEMINI_API_KEY;
if (!KEY) { console.error('GEMINI_API_KEY 없음'); process.exit(1); }

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-flash-lite-latest'];
for (const model of MODELS) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: '로봇청소기 배터리 교체 방법을 1문장으로' }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512, thinkingConfig: { thinkingBudget: 0 } },
      }),
    }
  );
  if (res.ok) {
    const j = await res.json();
    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text || '(빈응답)';
    console.log(`[${model}] ✅ HTTP 200 — ${text.length}자: ${text.slice(0, 50).replace(/\n/g, ' ')}`);
  } else {
    const txt = await res.text();
    const limitMatch = txt.match(/limit:\s*(\d+)/);
    const metricMatch = txt.match(/metric:\s*[^,]*?\/([a-z_]+)/);
    console.log(`[${model}] ❌ HTTP ${res.status} limit=${limitMatch?.[1] ?? '?'} metric=${metricMatch?.[1] || '?'}`);
  }
  await new Promise(r => setTimeout(r, 1500));
}
