import crypto from 'node:crypto';

const ENDPOINT = 'https://api-sg.aliexpress.com/sync';

function getEnv() {
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET;
  const trackingId = process.env.ALIEXPRESS_TRACKING_ID || 'default';
  if (!appKey || !appSecret) throw new Error('ALIEXPRESS_APP_KEY / ALIEXPRESS_APP_SECRET missing');
  return { appKey, appSecret, trackingId };
}

function tsGmt8(): string {
  const d = new Date(Date.now() + 8 * 3600 * 1000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function sign(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params).sort().map((k) => `${k}${params[k]}`).join('');
  return crypto.createHmac('sha256', secret).update(sorted, 'utf8').digest('hex').toUpperCase();
}

async function call<T = any>(method: string, biz: Record<string, string | number>): Promise<T> {
  const { appKey, appSecret } = getEnv();
  const all: Record<string, string> = {
    method,
    app_key: appKey,
    sign_method: 'sha256',
    timestamp: tsGmt8(),
    format: 'json',
    v: '2.0',
    ...Object.fromEntries(Object.entries(biz).map(([k, v]) => [k, String(v)]))
  };
  all.sign = sign(all, appSecret);
  const body = new URLSearchParams(all).toString();
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`AliExpress HTTP ${res.status}`);
  const json = await res.json();
  if (json?.error_response) throw new Error(`AliExpress: ${JSON.stringify(json.error_response)}`);
  return json as T;
}

export type AliCheapest = {
  product_id: string;
  title: string;
  image_url: string;
  price_usd: number;
  evaluate_rate_percent: number;
  source_url: string;
  affiliate_url: string;
};

export async function findCheapest(keyword: string): Promise<AliCheapest | null> {
  const { trackingId } = getEnv();
  const data = await call('aliexpress.affiliate.product.query', {
    keywords: keyword,
    page_size: 20,
    page_no: 1,
    sort: 'SALE_PRICE_ASC',
    target_currency: 'USD',
    target_language: 'EN',
    tracking_id: trackingId
  });
  const products: any[] =
    data?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product || [];
  if (!Array.isArray(products) || products.length === 0) return null;

  const filtered = products
    .map((p) => ({
      product_id: String(p.product_id),
      title: String(p.product_title || ''),
      image_url: String(p.product_main_image_url || ''),
      source_url: String(p.product_detail_url || ''),
      price_usd: Number(p.target_sale_price || p.sale_price || 0),
      evaluate_rate_percent: Number(String(p.evaluate_rate || '0').replace('%', '')) || 0,
      promotion_link_inline: p.promotion_link ? String(p.promotion_link) : ''
    }))
    .filter((p) => p.source_url && p.title && p.price_usd > 0 && p.evaluate_rate_percent >= 85);
  if (filtered.length === 0) return null;

  const best = filtered.sort((a, b) => a.price_usd - b.price_usd)[0];

  let affiliate_url = best.promotion_link_inline;
  if (!affiliate_url) {
    try {
      const gen = await call('aliexpress.affiliate.link.generate', {
        promotion_link_type: 0,
        source_values: best.source_url,
        tracking_id: trackingId
      });
      const link = gen?.aliexpress_affiliate_link_generate_response?.resp_result?.result
        ?.promotion_links?.promotion_link?.[0];
      affiliate_url = String(link?.promotion_link || '');
    } catch {
      affiliate_url = '';
    }
  }
  if (!affiliate_url) affiliate_url = best.source_url;

  return {
    product_id: best.product_id,
    title: best.title,
    image_url: best.image_url,
    price_usd: best.price_usd,
    evaluate_rate_percent: best.evaluate_rate_percent,
    source_url: best.source_url,
    affiliate_url
  };
}
