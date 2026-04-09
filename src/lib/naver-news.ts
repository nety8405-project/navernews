export type NaverNewsItem = {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
};

type NaverNewsResponse = {
  lastBuildDate?: string;
  total?: number;
  start?: number;
  display?: number;
  items?: NaverNewsItem[];
};

function stripHtmlEntities(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeNewsItem(raw: NaverNewsItem): NaverNewsItem {
  return {
    ...raw,
    title: stripHtmlEntities(raw.title),
    description: stripHtmlEntities(raw.description),
  };
}

export async function searchNaverNews(params: {
  clientId: string;
  clientSecret: string;
  query: string;
  display?: number;
  start?: number;
  sort?: "sim" | "date";
}): Promise<NaverNewsItem[]> {
  const display = Math.min(params.display ?? 50, 100);
  const start = params.start ?? 1;
  const sort = params.sort ?? "date";

  const url = new URL("https://openapi.naver.com/v1/search/news.json");
  url.searchParams.set("query", params.query);
  url.searchParams.set("display", String(display));
  url.searchParams.set("start", String(start));
  url.searchParams.set("sort", sort);

  const res = await fetch(url.toString(), {
    headers: {
      "X-Naver-Client-Id": params.clientId,
      "X-Naver-Client-Secret": params.clientSecret,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`네이버 뉴스 API 오류 (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as NaverNewsResponse;
  const items = data.items ?? [];
  return items.map(normalizeNewsItem);
}

export async function searchNaverNewsPaged(params: {
  clientId: string;
  clientSecret: string;
  query: string;
  sort?: "sim" | "date";
  maxItems: number;
  pageSize?: number;
}): Promise<NaverNewsItem[]> {
  const pageSize = Math.min(params.pageSize ?? 100, 100);
  const collected: NaverNewsItem[] = [];
  let start = 1;

  while (collected.length < params.maxItems && start <= 1000) {
    const batch = await searchNaverNews({
      ...params,
      display: pageSize,
      start,
    });
    if (batch.length === 0) break;
    collected.push(...batch);
    start += pageSize;
    if (batch.length < pageSize) break;
  }

  return collected.slice(0, params.maxItems);
}
