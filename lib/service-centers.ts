export type ServiceCenter = {
  brand: string;
  phone_kr?: string;
  phone_us?: string;
  website: string;
  support_url: string;
  hours_kr?: string;
  hours_en?: string;
  kakao?: string;
  email?: string;
  description_ko: string;
  description_en: string;
};

export const SERVICE_CENTERS: Record<string, ServiceCenter> = {
  iRobot: {
    brand: 'iRobot',
    phone_kr: '080-905-9999',
    phone_us: '1-800-727-9077',
    website: 'https://support.irobot.com',
    support_url: 'https://support.irobot.com/s/contactsupport',
    hours_kr: '평일 09:00~18:00 (주말·공휴일 휴무)',
    hours_en: 'Mon–Fri 9AM–6PM KST',
    description_ko: '아이로봇 한국 공식 고객센터. 제품 등록 후 온라인 접수를 권장합니다. 접수 시 구매 영수증과 시리얼 넘버 준비 필수.',
    description_en: 'Register your Roomba on the iRobot app before contacting support — this speeds up warranty claims significantly.',
  },
  Xiaomi: {
    brand: 'Xiaomi',
    phone_kr: '1566-8106',
    website: 'https://www.mi.com/kr',
    support_url: 'https://www.mi.com/kr/service/repair',
    hours_kr: '평일 09:00~18:00 (토/일/공휴일 휴무)',
    hours_en: 'Mon–Fri 9AM–6PM KST',
    description_ko: '샤오미 공인 서비스센터 전국 운영. 분당·광명·구로·강릉·대구·부산·남원 등 15개 이상. 방문 전 전화 예약 권장.',
    description_en: 'Xiaomi Korea has 15+ authorized service centers nationwide. Call 1566-8106 to find the nearest location.',
  },
  Ecovacs: {
    brand: 'Ecovacs',
    phone_kr: '1566-5578',
    website: 'https://www.ecovacs.com/kr',
    support_url: 'https://www.ecovacs.com/kr/support',
    hours_kr: '평일 09:00~18:00',
    hours_en: 'Mon–Fri 9AM–6PM KST',
    description_ko: '에코백스 한국 공식 AS. 콜센터 접수 후 택배 수거 서비스 이용 가능. 보증기간 내 무상 수리.',
    description_en: 'Ecovacs Korea offers pickup repair service — they collect the unit from your home. Warranty is 1 year from purchase.',
  },
  Neato: {
    brand: 'Neato',
    phone_us: '1-877-632-8669',
    website: 'https://support.neatorobotics.com',
    support_url: 'https://support.neatorobotics.com/hc/en-us/requests/new',
    hours_en: 'Mon–Fri 9AM–5PM PST',
    description_ko: '니토는 한국 공식 AS센터 없음. 이메일·온라인 티켓으로 접수. 답변까지 1~3 영업일 소요.',
    description_en: 'No Korean service center. Submit a ticket at support.neatorobotics.com — response within 1–3 business days.',
  },
  Shark: {
    brand: 'Shark',
    phone_us: '1-800-798-7398',
    website: 'https://www.sharkhome.com',
    support_url: 'https://www.sharkhome.com/support',
    hours_en: 'Mon–Fri 9AM–6PM EST',
    description_ko: '샤크는 한국 공식 AS 없음. 미국 고객센터 또는 구매처(아마존·쿠팡)를 통해 교환·환불 접수.',
    description_en: 'No Korean service center. For warranty claims, contact the retailer or call 1-800-798-7398.',
  },
  Eufy: {
    brand: 'Eufy',
    phone_kr: '02-6203-5975',
    website: 'https://www.eufylife.com',
    support_url: 'https://www.eufylife.com/support',
    hours_kr: '평일 09:00~18:00',
    hours_en: 'Mon–Fri 9AM–6PM KST',
    kakao: '@anker',
    description_ko: '유피(앙커코리아) AS. 카카오톡 @anker 채널로 빠른 문의 가능. 보증기간 1년, 배터리 6개월.',
    description_en: 'Eufy Korea support via phone or KakaoTalk @anker. 1-year warranty on units, 6 months on batteries.',
  },
  Roborock: {
    brand: 'Roborock',
    phone_kr: '080-600-1177',
    website: 'https://kr.roborock.com',
    support_url: 'https://kr.roborock.com/pages/support',
    hours_kr: '평일 09:00~18:00 (무료전화)',
    hours_en: 'Mon–Fri 9AM–6PM KST (toll-free)',
    description_ko: '로보락 한국 공식 AS. 080 무료전화 운영. 접수 후 택배 수거 또는 방문 수리. 1년 무상보증.',
    description_en: 'Roborock Korea offers free pickup repair. Call 080-600-1177 (toll-free). 1-year warranty.',
  },
  Samsung: {
    brand: 'Samsung',
    phone_kr: '1588-3366',
    website: 'https://www.samsung.com/kr',
    support_url: 'https://www.samsung.com/kr/support/',
    hours_kr: '연중무휴 24시간',
    hours_en: '24/7',
    description_ko: '삼성전자 서비스센터 전국 500개 이상. 삼성 멤버스 앱으로 방문예약 가능. 당일 수리 가능한 경우 많음.',
    description_en: 'Samsung has 500+ service centers across Korea. Book via Samsung Members app for priority same-day service.',
  },
  LG: {
    brand: 'LG',
    phone_kr: '1544-7777',
    website: 'https://www.lge.co.kr',
    support_url: 'https://www.lge.co.kr/support/serviceCenter.do',
    hours_kr: '연중무휴 24시간',
    hours_en: '24/7',
    description_ko: 'LG전자 서비스센터 전국 400개 이상. LG 씽큐 앱에서 온라인 접수 시 방문 예약 없이 출장 수리 가능. 코드제로 A9S 등 무선청소기도 동일 번호로 접수.',
    description_en: 'LG has 400+ service centers across Korea. Book via the LG ThinQ app for door-to-door repair service without an appointment.',
  },
  Dreame: {
    brand: 'Dreame',
    phone_kr: '1644-1758',
    website: 'https://www.dreametech.com/kr',
    support_url: 'https://www.dreametech.com/kr/pages/support',
    hours_kr: '평일 09:00~18:00',
    hours_en: 'Mon–Fri 9AM–6PM KST',
    email: 'support@dreametech.com',
    description_ko: '드리미 한국 공식 AS. 콜센터 접수 후 택배 수거 수리 가능. 1년 무상보증. 로봇청소기·물걸레·진공청소기 통합 접수.',
    description_en: 'Dreame Korea offers mail-in repair with free pickup. 1-year warranty. Contact via phone or email for service requests.',
  },
  Narwal: {
    brand: 'Narwal',
    phone_kr: '1800-5558',
    website: 'https://www.narwal.com/kr',
    support_url: 'https://www.narwal.com/kr/pages/support',
    hours_kr: '평일 09:00~18:00',
    hours_en: 'Mon–Fri 9AM–6PM KST',
    email: 'kr-support@narwal.com',
    description_ko: '나르왈 한국 공식 AS. 물걸레 자동 세척 시스템 전문 수리. 접수 후 택배 수거 서비스. 보증기간 1년 (세척 스테이션 포함).',
    description_en: 'Narwal Korea specializes in mop-auto-cleaning robot service. Pickup repair service available. 1-year warranty including the cleaning station.',
  },
};

export function getServiceCenter(brand: string): ServiceCenter | null {
  return SERVICE_CENTERS[brand] || null;
}
