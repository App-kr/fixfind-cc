/**
 * test-gemini.mjs — GEMINI_API_KEY 단일요청 진단 (키 노출 없음)
 * 각 모델에 1회만 요청 → HTTP status + 에러 사유만 출력
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
console.log(`키 확인: prefix=${KEY.slice(0, 6)} length=${KEY.length}\n`);

// 1) 모델 목록 (키 유효성 확인)
const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${KEY}`);
console.log(`[models.list] HTTP ${listRes.status}`);
if (listRes.ok) {
  const j = await listRes.json();
  const names = (j.models || []).map(m => m.name.replace('models/', '')).filter(n => n.includes('flash'));
  console.log('  flash 계열:', names.join(', '), '\n');
} else {
  console.log('  ', (await listRes.text()).slice(0, 200), '\n');
}

// 2) gemini-2.5-flash 실전 설정 확인 (thinking off + 충분한 토큰 → 실제 한글 생성)
const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: '로봇청소기 라이다 센서 고장 증상을 2문장으로 설명해' }] }],
      generationConfig: { temperature: 0.85, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } },
    }),
  }
);
if (res.ok) {
  const j = await res.json();
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log(`[gemini-2.5-flash 실전] HTTP 200 ✅ ${text.length}자`);
  console.log('  미리보기:', text.slice(0, 120).replace(/\n/g, ' '));
} else {
  console.log(`[gemini-2.5-flash 실전] HTTP ${res.status} ❌`, (await res.text()).slice(0, 200));
}
