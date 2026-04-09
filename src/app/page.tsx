"use client";

import { useCallback, useState } from "react";
import type { NewsApiResponse, NewsMode } from "@/types/analysis";

type FetchState =
  | { status: "idle" }
  | { status: "loading"; label: string }
  | { status: "error"; message: string }
  | { status: "ok"; data: NewsApiResponse };

const sentimentTone: Record<string, string> = {
  positive: "text-[#1d5c52]",
  negative: "text-[#a61e26]",
  neutral: "text-[#4f5860]",
  mixed: "text-[#7a4f1c]",
};

function sentimentArticleBarStrength(label: string): number {
  switch (label) {
    case "positive":
    case "negative":
      return 0.78;
    case "mixed":
      return 0.55;
    default:
      return 0.34;
  }
}

/** 막대 색 — 레이아웃·감정별 구분 */
const chartBar = {
  keyword: "bg-[#c12c32]",
  sentimentOverall: "bg-[#1e4976]",
  sentimentArticle: {
    positive: "bg-[#1d5c52]",
    negative: "bg-[#a61e26]",
    neutral: "bg-[#4f5860]",
    mixed: "bg-[#8a5f2c]",
  } as Record<string, string>,
};

function sentimentArticleBarColor(label: string): string {
  return chartBar.sentimentArticle[label] ?? chartBar.sentimentArticle.neutral;
}

function formatKstApiReference(d: Date): { timeLine: string; dateLine: string } {
  const timeLine = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(d);

  const dateLine = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(d);

  return { timeLine, dateLine };
}

function ApiReferenceCorner({ loading, at }: { loading: boolean; at: Date | null }) {
  if (loading) {
    return (
      <span className="font-mono-press block text-[11px] font-medium animate-pulse text-[var(--ink-muted)]">
        갱신 중…
      </span>
    );
  }
  if (at) {
    const { timeLine, dateLine } = formatKstApiReference(at);
    return (
      <>
        <time
          dateTime={at.toISOString()}
          className="font-mono-press block text-[11px] font-medium tabular-nums tracking-tight text-[var(--ink)]"
        >
          {timeLine} <span className="font-normal text-[var(--ink-faint)]">KST 기준</span>
        </time>
        <span className="font-mono-press mt-0.5 block text-[9px] leading-snug tracking-wide text-[var(--ink-faint)]">
          {dateLine} · 수집·API 응답 시각
        </span>
      </>
    );
  }
  return (
    <>
      <span className="font-mono-press block text-[11px] tabular-nums text-[var(--ink-faint)]">—:—</span>
      <span className="font-mono-press mt-0.5 block text-[9px] text-[var(--ink-faint)]">
        검색·분석 후 표시
      </span>
    </>
  );
}

/** 중요 키워드·맥락 감정(기사별) 표시 개수 */
const KEYWORD_AND_SENTIMENT_PREVIEW = 5;

function modeLabel(mode: NewsMode): string {
  switch (mode) {
    case "keyword":
      return "키워드";
    case "today":
      return "오늘";
    case "week":
      return "최근 7일";
    default:
      return mode;
  }
}

function MastheadKicker() {
  return (
    <div className="font-mono-press flex flex-wrap items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--ink-faint)]">
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ink)]/15 bg-[#fffdf8]/70 px-3 py-1">
        <span className="live-dot size-2 shrink-0 rounded-full bg-[var(--vermillion)]" aria-hidden />
        Live dispatch
      </span>
    </div>
  );
}

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [state, setState] = useState<FetchState>({ status: "idle" });
  const [runId, setRunId] = useState(0);
  /** 네이버 조회·AI 분석 요청이 완료된 시각 (클라이언트 기준, 표시는 KST) */
  const [apiReferenceAt, setApiReferenceAt] = useState<Date | null>(null);

  const run = useCallback(async (mode: NewsMode, kw?: string) => {
    const label =
      mode === "keyword" && kw
        ? `「${kw}」검색·분석 중`
        : `${modeLabel(mode)} 묶음을 집계·가공 중`;
    setState({ status: "loading", label });

    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, keyword: kw }),
      });
      const json = (await res.json()) as NewsApiResponse & { error?: string };
      if (!res.ok) {
        setState({
          status: "error",
          message: json.error || `요청 실패 (${res.status})`,
        });
        return;
      }
      setApiReferenceAt(new Date());
      setRunId((n) => n + 1);
      setState({ status: "ok", data: json as NewsApiResponse });
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "네트워크 오류",
      });
    }
  }, []);

  return (
    <div className="press-root press-grid min-h-full pb-24 pt-8 sm:pt-12">
      <div className="pointer-events-none fixed left-[5%] top-24 hidden h-40 w-px bg-[var(--ink)]/10 xl:block" />
      <div className="pointer-events-none fixed bottom-16 right-[8%] hidden h-48 w-px bg-[var(--vermillion)]/20 xl:block" />

      <main className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
        <header className="press-reveal mb-10 grid gap-10 lg:grid-cols-[1.15fr_0.35fr] lg:items-end">
          <div>
            <MastheadKicker />
            <h1 className="font-display mt-4 text-[clamp(1.35rem,3.6vw,2rem)] font-normal leading-tight tracking-[-0.02em] text-[var(--ink)]">
              실시간 <span className="text-[var(--vermillion)]">뉴스</span>를 확인해보자
            </h1>
            <div className="mt-6 max-w-xl">
              <div className="press-rule w-24 rounded-sm" aria-hidden />
              <p className="mt-5 text-[15px] leading-[1.75] text-[var(--ink-muted)]">
                네이버 뉴스 검색으로 키워드·맥락 감정·주제 분류·트렌드 분석
              </p>
            </div>
          </div>

          <aside
            className="font-display hidden rotate-[0.25deg] text-right text-[clamp(3rem,4.5vw,4.25rem)] leading-[0.85] text-[var(--ink)]/12 lg:block"
            aria-hidden
          >
            요약
            <br />
            키워드
            <br />
            감정
            <br />
            트렌드
          </aside>
        </header>

        <section className="press-reveal press-card relative max-w-4xl rounded-sm p-6 sm:p-8 [animation-delay:120ms]">
          <div className="font-mono-press absolute left-5 top-4 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--ink-faint)]">
            Control deck
          </div>
          <div
            className="absolute right-5 top-4 max-w-[min(100%-7rem,15rem)] text-right"
            aria-live="polite"
          >
            <ApiReferenceCorner loading={state.status === "loading"} at={apiReferenceAt} />
          </div>
          <div className="mt-10 flex flex-col gap-6 sm:mt-9 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <label htmlFor="kw" className="font-mono-press text-xs font-medium tracking-wide text-[var(--ink-muted)]">
                취재 키워드
              </label>
              <input
                id="kw"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && keyword.trim() && state.status !== "loading") {
                    run("keyword", keyword.trim());
                  }
                }}
                placeholder="예: 반도체, AI 규제, 금리 …"
                className="press-input font-body w-full rounded-sm px-4 py-3 text-base text-[var(--ink)] placeholder:text-[var(--ink-faint)]/75"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => keyword.trim() && run("keyword", keyword.trim())}
                disabled={!keyword.trim() || state.status === "loading"}
                className="press-btn-primary font-mono-press rounded-sm px-5 py-3 text-xs font-medium uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-45"
              >
                키워드
              </button>
              <button
                type="button"
                onClick={() => run("today")}
                disabled={state.status === "loading"}
                className="press-btn-ghost font-mono-press rounded-sm px-5 py-3 text-xs font-medium uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-45"
              >
                오늘
              </button>
              <button
                type="button"
                onClick={() => run("week")}
                disabled={state.status === "loading"}
                className="press-btn-ghost font-mono-press rounded-sm px-5 py-3 text-xs font-medium uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-45"
              >
                7일
              </button>
            </div>
          </div>

          {state.status === "loading" && (
            <p className="font-mono-press mt-6 flex items-center gap-2 text-xs text-[var(--ink-faint)]">
              <span className="inline-block size-3 animate-spin rounded-full border-2 border-[var(--ink)]/25 border-t-[var(--vermillion)]" />
              {state.label}
            </p>
          )}
          {state.status === "error" && (
            <div className="font-body mt-6 border-2 border-[#a61e26]/45 bg-[#a61e26]/08 px-4 py-3 text-sm text-[#5c1518]">
              {state.message}
            </div>
          )}
        </section>

        {state.status === "ok" && (() => {
          const keywordsPreview = state.data.analysis.keywords.slice(0, KEYWORD_AND_SENTIMENT_PREVIEW);
          const sentimentArticlesPreview = state.data.analysis.sentiment.articles.slice(
            0,
            KEYWORD_AND_SENTIMENT_PREVIEW,
          );
          return (
          <div key={runId} className="mt-14 space-y-12">
            <section
              className="press-reveal grid gap-6 lg:grid-cols-[auto_1fr] lg:gap-10"
              style={{ animationDelay: "40ms" }}
            >
              <span className="font-mono-press text-[11px] font-medium tabular-nums tracking-[0.18em] text-[var(--ink-faint)]">
                01
              </span>
              <div className="press-card rounded-sm p-6 sm:p-8">
                <h2 className="font-display text-2xl sm:text-3xl text-[var(--ink)]">종합 요약</h2>
                <p className="font-body mt-5 whitespace-pre-wrap text-[15px] leading-[1.8] text-[var(--ink-muted)]">
                  {state.data.analysis.summary}
                </p>
                <dl className="font-mono-press mt-8 grid gap-3 border-t-2 border-[var(--ink)]/12 pt-6 text-[11px] text-[var(--ink-faint)] sm:grid-cols-3">
                  <div>
                    <dt className="uppercase tracking-wider">모드</dt>
                    <dd className="mt-1 text-[var(--ink)]">{modeLabel(state.data.mode)}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="uppercase tracking-wider">쿼리</dt>
                    <dd className="mt-1 text-[var(--ink)]">{state.data.queryUsed}</dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-wider">분석 기사</dt>
                    <dd className="mt-1 text-[var(--ink)]">{state.data.articleCount}건</dd>
                  </div>
                </dl>
              </div>
            </section>

            <div className="grid gap-12 lg:grid-cols-2 lg:gap-10">
              <section
                className="press-reveal grid gap-5 lg:grid-cols-[auto_1fr]"
                style={{ animationDelay: "140ms" }}
              >
                <span className="font-mono-press text-[11px] font-medium tabular-nums tracking-[0.18em] text-[var(--ink-faint)]">
                  02
                </span>
                <div className="press-card-soft rounded-sm p-6">
                  <h2 className="font-display text-xl text-[var(--ink)]">중요 키워드</h2>
                  <p className="font-mono-press mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--ink-faint)]">
                    Importance-ranked
                  </p>
                  <ul className="mt-6 space-y-6">
                    {keywordsPreview.map((k, i) => (
                      <li
                        key={k.term}
                        className="press-reveal border-b border-[var(--ink)]/10 pb-6 last:border-0 last:pb-0"
                        style={{ animationDelay: `${200 + i * 55}ms` }}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-display text-lg text-[var(--ink)]">{k.term}</span>
                          <span className="font-mono-press text-[11px] tabular-nums text-[var(--ink-faint)]">
                            {k.importance}/10
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden border border-[var(--ink)]/25 bg-[#fffdf8]">
                          <div
                            className={`h-full w-full origin-left transition-transform duration-700 ease-out ${chartBar.keyword}`}
                            style={{ transform: `scaleX(${Math.min(1, k.importance / 10)})` }}
                          />
                        </div>
                        <p className="font-body mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{k.reason}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="press-reveal grid gap-5 lg:grid-cols-[auto_1fr]" style={{ animationDelay: "180ms" }}>
                <span className="font-mono-press text-[11px] font-medium tabular-nums tracking-[0.18em] text-[var(--ink-faint)]">
                  03
                </span>
                <div className="press-card-soft rounded-sm p-6">
                  <h2 className="font-display text-xl text-[var(--ink)]">맥락 감정</h2>
                  <p className="font-mono-press mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--ink-faint)]">
                    Article-level tone
                  </p>
                  <ul className="mt-6 space-y-6">
                    <li className="press-reveal border-b border-[var(--ink)]/10 pb-6">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="sr-only">전체 요약</span>
                        <span
                          className={`font-display text-lg capitalize ${sentimentTone[state.data.analysis.sentiment.overall] ?? ""}`}
                        >
                          {state.data.analysis.sentiment.overall}
                        </span>
                        <span className="font-mono-press text-[11px] tabular-nums text-[var(--ink-faint)]">
                          {state.data.analysis.sentiment.score.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden border border-[var(--ink)]/25 bg-[#fffdf8]">
                        <div
                          className={`h-full w-full origin-left transition-transform duration-700 ease-out ${chartBar.sentimentOverall}`}
                          style={{
                            transform: `scaleX(${Math.min(1, Math.max(0, (state.data.analysis.sentiment.score + 1) / 2))})`,
                          }}
                        />
                      </div>
                      <p className="font-body mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                        {state.data.analysis.sentiment.explanation}
                      </p>
                    </li>
                    {sentimentArticlesPreview.map((a, i) => (
                      <li
                        key={`${a.title}-${i}`}
                        className="press-reveal border-b border-[var(--ink)]/10 pb-6 last:border-0 last:pb-0"
                        style={{ animationDelay: `${260 + i * 40}ms` }}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-display min-w-0 flex-1 text-lg leading-snug text-[var(--ink)]">
                            {a.title}
                          </span>
                          <span
                            className={`font-mono-press shrink-0 text-[11px] font-medium uppercase tracking-wider ${sentimentTone[a.label] ?? ""}`}
                          >
                            {a.label}
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden border border-[var(--ink)]/25 bg-[#fffdf8]">
                          <div
                            className={`h-full w-full origin-left transition-transform duration-700 ease-out ${sentimentArticleBarColor(a.label)}`}
                            style={{ transform: `scaleX(${sentimentArticleBarStrength(a.label)})` }}
                          />
                        </div>
                        <p className="font-body mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{a.reason}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>

            <section className="press-reveal grid gap-5 lg:grid-cols-[auto_1fr]" style={{ animationDelay: "220ms" }}>
              <span className="font-mono-press text-[11px] font-medium tabular-nums tracking-[0.18em] text-[var(--ink-faint)]">
                04
              </span>
              <div className="press-card rounded-sm p-6 sm:p-8">
                <h2 className="font-display text-xl text-[var(--ink)]">트렌드 인사이트</h2>
                <ol className="font-body mt-6 space-y-4 text-[15px] leading-[1.75] text-[var(--ink-muted)]">
                  {state.data.analysis.trendInsights.map((t, i) => (
                    <li
                      key={t}
                      className="press-reveal flex gap-4"
                      style={{ animationDelay: `${320 + i * 80}ms` }}
                    >
                      <span className="font-mono-press mt-0.5 w-8 shrink-0 text-xs tabular-nums text-[var(--vermillion)]">
                        {(i + 1).toString().padStart(2, "0")}
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <section className="press-reveal grid gap-5 lg:grid-cols-[auto_1fr]" style={{ animationDelay: "260ms" }}>
              <span className="font-mono-press text-[11px] font-medium tabular-nums tracking-[0.18em] text-[var(--ink-faint)]">
                05
              </span>
              <div className="press-card-soft rounded-sm p-6 sm:p-8">
                <h2 className="font-display text-xl text-[var(--ink)]">원문 클리핑</h2>
                <ul className="mt-6 divide-y divide-[var(--ink)]/10">
                  {state.data.articles.map((a, i) => (
                    <li
                      key={a.link}
                      className="press-reveal py-5 first:pt-0 last:pb-0"
                      style={{ animationDelay: `${360 + i * 45}ms` }}
                    >
                      <a href={a.link} target="_blank" rel="noopener noreferrer" className="press-link font-display text-base">
                        {a.title}
                      </a>
                      <p className="font-mono-press mt-2 text-[10px] text-[var(--ink-faint)]">{a.pubDate}</p>
                      <p className="font-body mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{a.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
          );
        })()}
      </main>
    </div>
  );
}
