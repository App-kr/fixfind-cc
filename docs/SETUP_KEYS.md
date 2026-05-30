# fixfind.cc — API 키 발급 & 설정 가이드

> 모든 키는 **메모장으로 직접** `.env.local`에 입력합니다. 채팅창·커밋·스크린샷에 절대 붙여넣지 마세요.
> `.env.local`은 git에 올라가지 않습니다(gitignore 확인 완료). 라이브(fixfind.cc)에 반영하려면 **Vercel 환경변수에도 동일하게** 넣어야 합니다.

---

## 0. 현재 키 상태 한눈에

| 키 | 용도 | 로컬(.env.local) | Vercel(라이브) | 조치 |
|----|------|:---:|:---:|------|
| `GEMINI_API_KEY` | 영문·한글 가이드 생성 | ✅ | ✅ | 정상 |
| `NEXT_PUBLIC_SUPABASE_URL` | DB 주소 | ✅ | ✅ | 정상 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | DB 공개 읽기 | ✅ | ✅ | 정상 |
| `SUPABASE_SERVICE_ROLE_KEY` | DB 쓰기(서버) | ✅ | ✅ | 정상 |
| `CRON_SECRET` | 시딩/크론 인증 | ✅ | ✅ | 정상 |
| `NEXT_PUBLIC_SITE_URL` | 사이트 기준 URL | ✅ | ✅ | 정상 |
| `ADMIN_PASSWORD` | 관리자 로그인 비번 | ✅ | ? | 확인 |
| **`ADMIN_SESSION_SECRET`** | 관리자 세션 서명 | ❌ **없음** | ? | **추가 필요 → 1번** |
| **`ALIEXPRESS_APP_KEY`** | 제휴 API | ⬜ 값없음 | ❌ **없음** | **발급 필요 → 2번** |
| **`ALIEXPRESS_APP_SECRET`** | 제휴 API | ⬜ 값없음 | ❌ **없음** | **발급 필요 → 2번** |
| `ALIEXPRESS_TRACKING_ID` | 제휴 추적ID | ⬜ | ❌ | 2번에서 함께 |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | 애드센스 광고 | ⬜ 선택 | ⬜ 선택 | 선택 → 3번 |

➡️ **지금 막혀 있는 두 가지**: ① 관리자 로그인(세션 시크릿 없음) ② 알리 제휴 수익(앱키 없음).

---

## 1. ADMIN_SESSION_SECRET — 관리자 로그인 복구 (가장 빠름, 외부발급 불필요)

`lib/admin-auth.ts`가 세션 쿠키를 HMAC로 서명할 때 이 값을 씁니다. **없으면 로그인 시 서버가 에러**를 냅니다. 이건 외부에서 발급받는 키가 아니라 **임의의 랜덤 문자열**이면 됩니다.

### 1-1. 랜덤 시크릿 생성 (둘 중 하나)
```bash
# Node 로 생성 (권장)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 또는 PowerShell
# -join ((48..57)+(97..102) | Get-Random -Count 64 | % {[char]$_})
```
출력된 64자리 문자열을 **메모장으로** `.env.local`에 추가:
```
ADMIN_SESSION_SECRET=여기에_생성된_64자리_붙여넣기
```

### 1-2. Vercel에도 동일 값 등록
Vercel → 프로젝트(fixfind) → **Settings → Environment Variables**
- Name: `ADMIN_SESSION_SECRET` / Value: 위와 **같은 값** / Environment: Production
- 저장 후 **Redeploy** (Deployments → 최신 → ⋯ → Redeploy)

### 1-3. 검증
`https://fixfind.cc/admin/login` 접속 → `ADMIN_PASSWORD` 값으로 로그인 → 대시보드 진입되면 성공.

> ⚠️ 비밀번호(`ADMIN_PASSWORD`)는 제가 바꾸지 않습니다(프로젝트 보안 규칙). 변경은 직접 메모장으로만.

---

## 2. AliExpress 제휴 API — 수익 링크 활성화 (외부 계정 발급 필요)

지금은 제휴키가 없어 상품 페이지에 **"알리에서 부품 검색" 폴백 링크**만 노출됩니다(작동은 함). 아래를 완료하면 **실제 커미션이 붙는 최저가 상품 링크**로 자동 교체됩니다.

### 2-1. 계정 만들기 (직접 — 제가 대신 못 만듭니다)
1. **AliExpress Portals(제휴 포털)** 가입: <https://portals.aliexpress.com>
   - 한국에서 막히면 대안: **AliExpress Affiliate via Admitad / 알리 공식 Affiliate** 도 가능. Portals가 표준.
2. 가입 승인 후 로그인 → 상단 **Tools / API** 메뉴 진입.

### 2-2. 개발자 앱 생성 → App Key / App Secret
1. **API → App Management(앱 관리)** → **Create App**.
2. 앱 종류는 **Server-side / Self-developed** 선택.
3. 생성되면 **App Key**(숫자)와 **App Secret**(긴 문자열) 발급.
4. 콜백/도메인 입력 요구 시: `https://fixfind.cc` 기입.

### 2-3. Tracking ID 확인
- Portals → **Account / Tracking** 에서 기본 `tracking_id`(PID) 확인. 보통 `default` 또는 본인이 만든 채널명.

### 2-4. .env.local 에 입력 (메모장)
```
ALIEXPRESS_APP_KEY=발급받은_앱키
ALIEXPRESS_APP_SECRET=발급받은_앱시크릿
ALIEXPRESS_TRACKING_ID=확인한_트래킹ID
```

### 2-5. 기존 글에 제휴링크 백필 (로컬 1회 실행)
```bash
cd Q:/SideProjects/fixfind-cc
node scripts/fill-affiliate.mjs --dry     # 먼저 키워드만 미리보기(알리 호출 0)
node scripts/fill-affiliate.mjs           # 실제 백필 (없는 것만)
node scripts/fill-affiliate.mjs --force   # 전체 재갱신이 필요할 때만
```
성공 시 각 글의 `affiliate_url / affiliate_price / affiliate_image`가 채워집니다.

### 2-6. Vercel에도 3개 키 등록 + Redeploy
- 매일 자동 시딩(크론)이 신규 글에 제휴링크를 자동으로 붙이려면 **Vercel 환경변수에도 3개** 등록 필요.
- Settings → Environment Variables → `ALIEXPRESS_APP_KEY` / `ALIEXPRESS_APP_SECRET` / `ALIEXPRESS_TRACKING_ID` 추가 → Redeploy.

### 2-7. 검증
```bash
# 백필 후 채워진 개수 확인
node scripts/verify-ko.mjs   # (참고용 카운트)
```
또는 라이브에서 아무 글이나 열어 "🛒 Replacement Part" 버튼이 **"Check Current Price on AliExpress"**(그라데이션) 로 바뀌었는지 확인. 폴백 검색버튼이면 아직 미반영.

---

## 3. (선택) Google AdSense — 광고 수익

1. <https://adsense.google.com> 가입 → 사이트 `fixfind.cc` 추가 → 승인 대기(수일).
2. 승인 후 **게시자 ID** `ca-pub-XXXXXXXXXXXXXXXX` 확인.
3. `.env.local` 및 Vercel:
   ```
   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
   ```
4. Redeploy 시 `app/layout.tsx`가 자동으로 애드센스 스크립트를 로드합니다.

---

## 4. 콘텐츠 더 늘리기 (키 발급과 무관, 지금도 가능)

`GEMINI_API_KEY`만 있으면 글을 계속 추가할 수 있습니다(알리키 없어도 폴백 링크로 발행됨).
```bash
cd Q:/SideProjects/fixfind-cc
node scripts/seed-bulk.mjs --batches=5 --count=10   # 최대 50건 추가 (배치당 Gemini 1회)
```
- 이미 발행된 글과 **중복되지 않게** 자동 필터링됩니다(slug 기준).
- Gemini 일일 한도에 걸리면 다음날 오전(한국시간) 리셋 후 재실행.
- 신규 글은 영문+한글 가이드가 함께 생성되고, 사이트맵에 자동 등록되어 구글에 노출됩니다.

---

## 5. 보안 원칙 (반드시 준수)

- 키는 **메모장 → .env.local** 경로로만 입력. 채팅·커밋·이슈·스크린샷 금지.
- `.env.local`은 gitignore 처리됨(커밋 안 됨). Vercel 키는 대시보드에서만 관리.
- 키가 노출되면: 해당 서비스 콘솔에서 **즉시 재발급(rotate)** 후 .env.local·Vercel 양쪽 교체.
- `ADMIN_PASSWORD`/`ADMIN_SESSION_SECRET`는 외부에 공유 금지. 변경은 직접.
