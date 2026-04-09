import OpenAI from "openai";
import type { AiAnalysis, NewsArticlePayload } from "@/types/analysis";
import { getOpenAiModel } from "@/lib/env";

const ANALYSIS_JSON_INSTRUCTION = `당신은 한국어 뉴스 분석가입니다. 입력으로 뉴스 기사 목록(제목·요약·날짜)이 주어집니다.
다음 JSON 스키마에 맞는 단일 JSON 객체만 출력하세요. 다른 설명·마크다운·코드펜스는 금지합니다.

스키마:
{
  "summary": "string (전체 흐름을 3~5문장으로 요약)",
  "keywords": [
    { "term": "string", "importance": 1-10 정수, "reason": "string (왜 중요한지 한 문장)" }
  ],
  "sentiment": {
    "overall": "positive" | "negative" | "neutral" | "mixed",
    "score": -1에서 1 사이 소수,
    "explanation": "string (맥락·균형 있게)",
    "articles": [
      { "title": "입력과 동일한 제목", "label": "positive"|"negative"|"neutral"|"mixed", "reason": "string" }
    ]
  },
  "categories": [
    { "name": "string (예: 정치, 경제, 사회, IT/과학, 세계, 생활/문화, 연예, 스포츠 등)", "count": 정수, "examples": ["해당 주제 대표 제목 1~2개"] }
  ],
  "trendInsights": ["string (3~5개) 트렌드·패턴·시사점"]
}

규칙:
- keywords는 중요도 순으로 최대 12개, importance는 상대 비교 가능하게 부여.
- sentiment.articles는 입력의 모든 기사에 대해 한 행씩 포함하고, title은 입력과 동일한 문자열.
- categories는 기사를 재구성한 주제별 묶음, count는 해당 묶음 기사 수의 합이 전체와 맞도록.
- trendInsights는 단순 나열이 아니라 공통 주제·갈등·방향성을 짚을 것.`;

function buildUserContent(
  mode: string,
  queryUsed: string,
  articles: NewsArticlePayload[],
): string {
  const lines = articles.map(
    (a, i) =>
      `${i + 1}. 제목: ${a.title}\n   요약: ${a.description}\n   링크: ${a.link}\n   날짜: ${a.pubDate}`,
  );
  return [
    `수집 모드: ${mode}`,
    `검색·수집에 사용된 쿼리: ${queryUsed}`,
    `기사 수: ${articles.length}`,
    "",
    ...lines,
  ].join("\n");
}

export async function analyzeNewsWithOpenAI(params: {
  apiKey: string;
  mode: string;
  queryUsed: string;
  articles: NewsArticlePayload[];
}): Promise<AiAnalysis> {
  if (params.articles.length === 0) {
    return {
      summary: "분석할 기사가 없습니다.",
      keywords: [],
      sentiment: {
        overall: "neutral",
        score: 0,
        explanation: "기사가 없어 감정 분석을 수행하지 않았습니다.",
        articles: [],
      },
      categories: [],
      trendInsights: [],
    };
  }

  const openai = new OpenAI({ apiKey: params.apiKey });
  const model = getOpenAiModel();

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ANALYSIS_JSON_INSTRUCTION },
      {
        role: "user",
        content: buildUserContent(params.mode, params.queryUsed, params.articles),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI 응답이 비어 있습니다.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI JSON 파싱에 실패했습니다.");
  }

  return parsed as AiAnalysis;
}
