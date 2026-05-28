type Props = {
  href: string | null;
  price?: number | null;
  partName: string;
};

export default function AffiliateCTA({ href, price, partName }: Props) {
  if (!href) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Price lookup pending. Check back tomorrow after the daily sync.
      </div>
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
