export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`환경 변수 ${name} 가 설정되지 않았습니다. .env.local 을 확인하세요.`);
  }
  return value.trim();
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}
