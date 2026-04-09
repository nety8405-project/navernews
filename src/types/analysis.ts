export type NewsMode = "keyword" | "today" | "week";

export type KeywordInsight = {
  term: string;
  importance: number;
  reason: string;
};

export type ArticleSentiment = {
  title: string;
  label: "positive" | "negative" | "neutral" | "mixed";
  reason: string;
};

export type CategoryBucket = {
  name: string;
  count: number;
  examples: string[];
};

export type AiAnalysis = {
  summary: string;
  keywords: KeywordInsight[];
  sentiment: {
    overall: "positive" | "negative" | "neutral" | "mixed";
    score: number;
    explanation: string;
    articles: ArticleSentiment[];
  };
  categories: CategoryBucket[];
  trendInsights: string[];
};

export type NewsArticlePayload = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
};

export type NewsApiResponse = {
  mode: NewsMode;
  queryUsed: string;
  articleCount: number;
  articles: NewsArticlePayload[];
  analysis: AiAnalysis;
};
