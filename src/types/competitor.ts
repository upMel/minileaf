// Raw shapes returned by the external competitor S3 data feed.
// Used internally by the API routes to avoid `any` casts.

export type RawSub = { uuid: number; name: string };
export type RawCat = { uuid: number; name: string; sub_categories?: RawSub[] };
export type RawMerchant = { merchant_uuid: number; display_name: string };
export type RawPrice = { merchant_uuid: number; price: number };
export type RawProduct = {
  barcode: string;
  name: string;
  category?: number[];
  image?: string;
  prices?: RawPrice[];
};
export type RawResult = {
  merchants?: RawMerchant[];
  categories?: RawCat[];
  products?: RawProduct[];
  img_base_url?: string;
};
export type RawApiData = { context?: { MAPP_PRODUCTS?: { result?: RawResult } } };
