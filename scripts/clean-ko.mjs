/**
 * clean-ko.mjs — solution_ko 의 마크다운 기호 제거 (LLM 미사용, 무료)
 * whitespace-pre-line 로 렌더되므로 #, **, 불릿 기호가 그대로 보이는 문제 해결.
 * 줄바꿈/이모지/문장은 보존, 마크다운 마커만 정리.
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
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes('--dry');
const H = { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}` };

function cleanMd(s) {
  return s
    .split('\n')
    .map((line) => {
      let l = line;
      l = l.replace(/^\s{0,3}#{1,6}\s*/, '');        // ### 헤더 마커 제거 (텍스트 유지)
      l = l.replace(/^\s*[-*•]\s+/, '· ');           // 불릿 → 가운뎃점
      l = l.replace(/^\s*\d+\.\s+/, (m) => m.trim() + ' '); // "1." 번호는 유지
      l = l.replace(/\*\*([^*]+)\*\*/g, '$1');       // **굵게** → 텍스트
      l = l.replace(/\*([^*]+)\*/g, '$1');           // *기울임* → 텍스트
      l = l.replace(/__([^_]+)__/g, '$1');           // __밑줄__ → 텍스트
      l = l.replace(/`([^`]+)`/g, '$1');             // `코드` → 텍스트
      return l.replace(/\s+$/, '');
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')                       // 빈 줄 3개+ → 2개
    .trim();
}

const r = await fetch(`${URL}/rest/v1/parts_db?select=id,solution_ko&solution_ko=not.is.null&limit=300`, { headers: H });
const rows = await r.json();
let changed = 0, skipped = 0;
for (const row of rows) {
  const cleaned = cleanMd(row.solution_ko);
  if (cleaned === row.solution_ko) { skipped++; continue; }
  if (DRY) {
    console.log(`[ID ${row.id}] 변경됨 (${row.solution_ko.length}→${cleaned.length}자)`);
    changed++;
    continue;
  }
  const pr = await fetch(`${URL}/rest/v1/parts_db?id=eq.${row.id}`, {
    method: 'PATCH',
    headers: { ...H, Prefer: 'return=minimal' },
    body: JSON.stringify({ solution_ko: cleaned }),
  });
  if (pr.ok) { console.log(`[ID ${row.id}] ✅ 정리 (${row.solution_ko.length}→${cleaned.length}자)`); changed++; }
  else console.log(`[ID ${row.id}] ❌ PATCH 실패 ${pr.status}`);
}
console.log(`\n📊 정리: ${changed}개 / 변경없음: ${skipped}개 / 전체: ${rows.length}개${DRY ? ' [DRY]' : ''}`);
