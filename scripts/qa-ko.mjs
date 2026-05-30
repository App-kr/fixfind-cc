/** qa-ko.mjs — 64개 한글 가이드 품질 점검 (LLM 미사용) */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
function loadEnv() {
  const raw = readFileSync(resolve(__dirname, '../.env.local'), 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('='); if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}
const env = loadEnv();
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/parts_db?select=id,brand,model,error_code,solution_ko&order=id.asc&limit=300`, { headers: H });
const rows = await r.json();

function hangulRatio(s) {
  const letters = (s.match(/[\p{L}]/gu) || []).length;
  const hangul = (s.match(/[가-힣]/g) || []).length;
  return letters ? hangul / letters : 0;
}
const flags = [];
let okCount = 0;
for (const x of rows) {
  const s = x.solution_ko || '';
  const issues = [];
  if (!s) issues.push('빈값');
  if (s.length < 300) issues.push(`짧음(${s.length}자)`);
  if (/준비\s*중|placeholder|TODO/i.test(s)) issues.push('placeholder');
  if (/[#]{1,6}\s|\*\*/.test(s)) issues.push('마크다운잔류');
  const hr = hangulRatio(s);
  if (hr < 0.45 && s.length > 0) issues.push(`한글비율낮음(${(hr * 100).toFixed(0)}%)`);
  // 브랜드/모델 언급 여부 (관련성)
  const brandWord = (x.brand || '').toLowerCase();
  const mentionsBrand = brandWord && s.toLowerCase().includes(brandWord);
  if (issues.length) flags.push(`[ID ${x.id}] ${x.brand} ${x.model} → ${issues.join(', ')}`);
  else okCount++;
}
console.log(`전체 ${rows.length}개 / 정상 ${okCount}개 / 플래그 ${flags.length}개\n`);
if (flags.length) { console.log('⚠️ 점검 필요:'); flags.forEach(f => console.log('  ' + f)); }
else console.log('✅ 전 게시물 통과 (길이/한글비율/placeholder/마크다운 이상 없음)');

// 길이 분포
const lens = rows.map(x => (x.solution_ko || '').length).sort((a, b) => a - b);
console.log(`\n길이 분포: 최소 ${lens[0]} / 중앙 ${lens[Math.floor(lens.length / 2)]} / 최대 ${lens[lens.length - 1]}`);
