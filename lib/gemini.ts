import { GoogleGenerativeAI } from '@google/generative-ai';

const MIN_COUNT = 1;
const MAX_COUNT = 10;

function buildPrompt(count: number): string {
  return `You are a senior SEO researcher curating a HIGH-AUTHORITY robot vacuum repair database. Target: English-speaking users who Google exact error codes or symptoms to fix their robot vacuum at home.

Task: Output exactly ${count} distinct ${count === 1 ? 'entry' : 'entries'} covering robot vacuum repair topics with HIGH monthly search volume on Google/YouTube.

STRICT SELECTION CRITERIA — ALL must be true:
1. Robot vacuum brand/model released 3+ years ago, widely owned, and commonly breaks in this specific way.
2. The error code OR symptom is EXACT and people type it verbatim into Google (e.g. "Roomba error 5", "Roomba not charging", "Ecovacs error 3").
3. The replacement part is sold on AliExpress/eBay/Amazon as a generic aftermarket SKU under $40.
4. Model name is REAL and verifiable. NO invented model numbers.

TARGET BRANDS & HIGH-SEARCH MODELS (vary — do NOT repeat same model):
- iRobot Roomba: 614, 650, 655, 675, 690, 770, 780, 860, 880, 890, 960, 980, i3, i7, e5, e6
- Xiaomi Mi Robot Vacuum: SDJQR02RR (1st gen), SKV4093GL (Pro), STYTJ02YM (Mop)
- Ecovacs Deebot: N79, N79S, 500, 600, 900, OZMO 930, T8 AIVI, U2 Pro
- Neato Botvac: D80, D85, D3 Connected, D5 Connected, D7 Connected
- Shark IQ: RV1000, AV970, AV2001WD
- Eufy RoboVac: 11S, 30C, 35C, G30, L70 Hybrid
- Roborock: S5, S5 Max, S6, S6 Pure, S6 MaxV, S7
- Samsung POWERbot: SR20M7070WH, VR10M7030WW

HIGH-SEARCH ERROR CODES / SYMPTOMS TO COVER (pick specific ones, vary per batch):
Error codes: Roomba Error 1/2/5/6/7/8/9/10/14, Charging Error 3/5/6, Roomba "Uh Oh" 1/2 beeps
Xiaomi errors: Error 1/2/3/4/5/6/7/8/10, "Please clean the main brush"
Ecovacs: Error 3/4/5/6/7/8/DEEBOT dust box full
Neato: "My Neato is stuck", brush error, not charging
Roborock: Error 1/2/3/4/5/6/7/9/10/11/12
Generic: "[brand] not charging", "[brand] spinning in circles", "[brand] bumper stuck", "[brand] won't dock", "[brand] battery not holding charge", "[brand] side brush not spinning", "[brand] cliff sensor error", "[brand] dustbin full error keeps triggering"

Required JSON shape per entry (all values English):
{
  "brand":      "exact brand name (e.g. 'iRobot', 'Xiaomi', 'Ecovacs', 'Neato', 'Shark', 'Eufy', 'Roborock', 'Samsung')",
  "model":      "specific model name (e.g. 'Roomba 650', 'Deebot N79S', 'RoboVac 11S')",
  "error_code": "exact error code or symptom people search (e.g. 'Error 5', 'Charging Error 3', 'not charging', 'spinning in circles'); '' only if truly generic",
  "solution":   "3-4 sentence English fix guide. State what the error means, the root cause, exact fix steps, and the replacement part with aftermarket price range in USD (e.g. '$8-15'). Be specific enough that someone can follow without a manual.",
  "solution_ko": "한국어 수리 가이드. 이 에러가 왜 발생하는지, 어떻게 고치는지, 필요한 부품과 국내 예상 가격(원화)을 자연스러운 한국어로 3-4문장. AI 번역 느낌 없이 실제 수리 블로그처럼.",
  "part_name":  "exact AliExpress-searchable part name (e.g. 'Roomba 600 series side brush module', 'Roomba 650 battery 14.4V 3000mAh', 'Deebot N79 side brush', 'robot vacuum cliff sensor board')"
}

TONE RULES (critical — Google will penalize AI-generated text):
- English: Write like a repair technician explaining to a friend. Use contractions, specific observations ("The suction motor housing tends to crack right at the mounting bracket"), community knowledge ("This shows up constantly on iFixit forums for 3+ year old units"). NO generic phrases like "It is important to note" or "This solution ensures".
- Korean: 실제 수리 블로그나 네이버 카페 글처럼. "이 에러는 대부분..." "직접 열어보면..." "국내에서는 보통 만원대에 부품 구할 수 있습니다" 같은 자연스러운 표현 사용. 번역체 절대 금지.

REJECT:
- Made-up model numbers or error codes not documented online
- Parts costing over $60 aftermarket
- Firearms, adult, tobacco, vaping, prescription medical
- Same brand more than 3 times within this batch
- Duplicate models from previous known entries: irobot/roomba-650, bose/quietcomfort-35, nintendo/switch-joy-con, canon/eos-rebel-t3i, apple/ipod-classic, irobot/roomba-650, gopro/hero-4-black, logitech/g-pro-wireless, samsung/wf42h5000aw, apple/macbook-pro-15-a1398

Output ONLY a JSON array of ${count} object${count === 1 ? '' : 's'}. No markdown, no prose, no comments.`;
}

export type RepairEntry = {
  brand: string;
  model: string;
  error_code: string;
  solution: string;
  solution_ko: string;
  part_name: string;
};

function sanitize(e: any): RepairEntry | null {
  if (!e || typeof e !== 'object') return null;
  const brand = String(e.brand || '').trim();
  const model = String(e.model || '').trim();
  const part_name = String(e.part_name || '').trim();
  const solution = String(e.solution || '').trim();
  const solution_ko = String(e.solution_ko || '').trim();
  const error_code = String(e.error_code || '').trim();
  if (!brand || !model || !part_name || !solution) return null;
  if (brand.length > 60 || model.length > 80 || part_name.length > 80) return null;
  if (solution.length > 800) return null;
  if (solution_ko.length > 800) return null;
  return { brand, model, part_name, solution, solution_ko, error_code };
}

export function clampCount(raw: unknown, fallback: number = 1): number {
  const n = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(n) || Number.isNaN(n)) return fallback;
  return Math.max(MIN_COUNT, Math.min(MAX_COUNT, Math.trunc(n)));
}

export async function fetchRepairEntries(count: number = 1): Promise<RepairEntry[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');

  const safeCount = clampCount(count, 1);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { temperature: 0.85, responseMimeType: 'application/json' }
  });

  const result = await model.generateContent(buildPrompt(safeCount));
  const text = result.response.text().trim();
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned non-JSON: ${text.slice(0, 200)}`);
  }
  if (!Array.isArray(parsed)) throw new Error('Gemini response not an array');

  const out: RepairEntry[] = [];
  for (const e of parsed) {
    const s = sanitize(e);
    if (s) out.push(s);
    if (out.length >= safeCount) break;
  }
  if (out.length === 0) throw new Error('Gemini returned 0 valid entries');
  return out;
}
