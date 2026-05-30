type Props = {
  href: string | null;
  price?: number | null;
  partName: string;
  /** 제휴링크가 아직 없을 때 폴백 검색에 쓸 키워드 (브랜드+모델+부품명) */
  searchKeyword?: string;
};

export default function AffiliateCTA({ href, price, partName, searchKeyword }: Props) {
  // 제휴링크 미설정 → 알리익스프레스 부품 검색 링크로 폴백 (작동하는 버튼)
  if (!href) {
    const q = encodeURIComponent((searchKeyword || partName).replace(/\s+/g, ' ').trim());
    const searchUrl = `https://www.aliexpress.com/wholesale?SearchText=${q}`;
    return (
      <a
        href={searchUrl}
        target="_blank"
        rel="sponsored nofollow noopener"
        className="block rounded-xl border-2 border-gray-900 bg-white px-5 py-4 text-center text-gray-900 transition hover:bg-gray-50"
      >
        <div className="text-xs uppercase tracking-wider text-gray-500">{partName}</div>
        <div className="mt-1 text-lg font-bold">알리익스프레스에서 부품 검색 →</div>
        <div className="mt-1 text-xs text-gray-400">Find this part on AliExpress</div>
      </a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener"
      className="block rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 px-5 py-4 text-center text-white shadow-md transition hover:from-brand-700 hover:to-brand-900"
    >
      <div className="text-xs uppercase tracking-wider opacity-80">Replacement {partName}</div>
      <div className="mt-1 text-lg font-bold">Check Current Price on AliExpress</div>
      {price != null && price > 0 && (
        <div className="mt-1 text-sm opacity-90">from ${price.toFixed(2)}</div>
      )}
    </a>
  );
}
