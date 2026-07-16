# 측정·색인 설치 가이드 (measurement first)

> 목표: "유입이 있나?"를 **숫자로 볼 수 있게** 만들고, 구글·네이버에 사이트를 **등록**한다.
> 코드는 이미 준비됨 — 아래 3개 값만 발급받아 환경변수에 넣으면 자동 작동한다.

코드 측 준비 완료 (`app/layout.tsx`):
- `NEXT_PUBLIC_GA_ID` → GA4 측정 스크립트 자동 삽입
- `GOOGLE_SITE_VERIFICATION` → 구글 소유확인 메타태그 자동 출력
- `NAVER_SITE_VERIFICATION` → 네이버 소유확인 메타태그 자동 출력

값이 비어 있으면 아무것도 출력되지 않으므로, 하나씩 채워도 안전하다.

---

## 1. GA4 (방문자 측정) — 가장 먼저

1. https://analytics.google.com 접속 (koreadobby 구글 계정)
2. 관리(⚙️) → 만들기 → **속성** → 이름 `fixfind`, 시간대 **대한민국**, 통화 KRW
3. 플랫폼 **웹** → 웹사이트 URL `https://fixfind.cc`, 스트림 이름 `fixfind`
4. 생성되면 **측정 ID** `G-XXXXXXXXXX` 복사
5. 배포 환경(Vercel)의 환경변수에 넣기:
   - `NEXT_PUBLIC_GA_ID = G-XXXXXXXXXX`

## 2. 구글 서치콘솔 (색인·검색유입 확인) — 핵심

1. https://search.google.com/search-console → **속성 추가** → **URL 접두어** → `https://fixfind.cc`
2. 소유확인 방법에서 **HTML 태그** 선택
3. 나오는 `<meta name="google-site-verification" content="여기값" />` 에서 **content 값만** 복사
4. 환경변수: `GOOGLE_SITE_VERIFICATION = 여기값`
5. 배포 후 서치콘솔에서 **확인** 클릭
6. 확인되면 → **Sitemaps** 메뉴에서 `sitemap.xml` 제출
7. 며칠 뒤 **페이지 색인 생성** 리포트에서 색인/제외 사유 확인 (여기서 진짜 유입·색인 실태가 보임)

## 3. 네이버 서치어드바이저 (한국 색인 병행)

1. https://searchadvisor.naver.com → 웹마스터도구 → **사이트 등록** → `https://fixfind.cc`
2. 소유확인 **HTML 태그** → `content` 값만 복사
3. 환경변수: `NAVER_SITE_VERIFICATION = 여기값`
4. 배포 후 **소유확인** → 요청 → **사이트맵 제출**(`sitemap.xml`) → **웹페이지 수집** 요청

---

## 환경변수 넣는 위치 (Vercel)
Vercel 프로젝트 → Settings → Environment Variables → 위 3개 추가 → **Redeploy**.
로컬 테스트는 `.env.local`에 동일하게 넣으면 됨(`.env.local.example` 참고).

## 설치 확인 방법
배포 후 브라우저에서 `https://fixfind.cc` → 페이지 소스 보기(Ctrl+U):
- `G-XXXXXXXXXX` (gtag) 검색되면 GA4 OK
- `google-site-verification` 메타 있으면 구글 OK
- `naver-site-verification` 메타 있으면 네이버 OK

## 주의
- 이 3개 값은 비밀키가 아니라 **공개 식별자**다(페이지 소스에 그대로 노출됨). API 키처럼 숨길 필요 없음.
- 측정은 데이터가 쌓이는 데 시간이 걸린다. GA4는 즉시, 서치콘솔/네이버 색인 리포트는 **며칠~2주** 후부터 의미 있는 숫자가 나온다.
