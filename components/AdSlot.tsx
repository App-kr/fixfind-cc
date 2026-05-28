type Props = {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
};

export default function AdSlot({ slot, format = 'auto', className = '' }: Props) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  if (!client) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400 ${className}`}
        style={{ minHeight: 96 }}
        aria-hidden="true"
      >
        Ad slot · {slot}
      </div>
    );
  }
  return (
    <ins
      className={`adsbygoogle block ${className}`}
      style={{ display: 'block' }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
