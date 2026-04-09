import { NextResponse } from "next/server";
import { requireEnv } from "@/lib/env";
import { searchNaverNewsPaged, type NaverNewsItem } from "@/lib/naver-news";
import { isTodayKst, isWithinRollingDays, parseNaverPubDate } from "@/lib/time-kst";
import { analyzeNewsWithOpenAI } from "@/lib/analyze-news";
import type { NewsArticlePayload, NewsMode } from "@/types/analysis";

export const runtime = "nodejs";

const BROAD_QUERY = "주요뉴스";

type Body = {
  mode?: NewsMode;
  keyword?: string;
};

function toPayload(items: NaverNewsItem[]): NewsArticlePayload[] {
  return items.map((item) => ({
    title: item.title,
    description: item.description,
    link: item.originallink || item.link,
    pubDate: item.pubDate,
  }));
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const mode = body.mode;
  if (mode !== "keyword" && mode !== "today" && mode !== "week") {
    return NextResponse.json(
      { error: "mode는 keyword, today, week 중 하나여야 합니다." },
      { status: 400 },
    );
  }

  if (mode === "keyword") {
    const kw = body.keyword?.trim();
    if (!kw) {
      return NextResponse.json(
        { error: "키워드 모드에서는 keyword가 필요합니다." },
        { status: 400 },
      );
    }
  }

  let naverId: string;
  let naverSecret: string;
  let openaiKey: string;
  try {
    naverId = requireEnv("NAVER_CLIENT_ID");
    naverSecret = requireEnv("NAVER_CLIENT_SECRET");
    openaiKey = requireEnv("OPENAI_API_KEY");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "환경 변수 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const queryUsed =
    mode === "keyword"
      ? (body.keyword as string).trim()
      : mode === "today"
        ? BROAD_QUERY
        : BROAD_QUERY;

  try {
    const maxFetch = mode === "keyword" ? 80 : 100;
    let items = await searchNaverNewsPaged({
      clientId: naverId,
      clientSecret: naverSecret,
      query: queryUsed,
      sort: "date",
      maxItems: maxFetch,
      pageSize: 100,
    });

    const now = new Date();
    if (mode === "today") {
      items = items.filter((it) => {
        const d = parseNaverPubDate(it.pubDate);
        return !Number.isNaN(d.getTime()) && isTodayKst(d, now);
      });
    } else if (mode === "week") {
      items = items.filter((it) => {
        const d = parseNaverPubDate(it.pubDate);
        return !Number.isNaN(d.getTime()) && isWithinRollingDays(d, 7, now);
      });
    }

    const capped = items.slice(0, 20);
    const articles = toPayload(capped);

    const analysis = await analyzeNewsWithOpenAI({
      apiKey: openaiKey,
      mode,
      queryUsed,
      articles,
    });

    return NextResponse.json({
      mode,
      queryUsed,
      articleCount: articles.length,
      articles,
      analysis,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "알 수 없는 오류";
    console.error("[api/news]", e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
