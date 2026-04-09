const KST = "Asia/Seoul";

function calendarDayKeyKst(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: KST });
}

export function isSameCalendarDayKst(a: Date, b: Date): boolean {
  return calendarDayKeyKst(a) === calendarDayKeyKst(b);
}

export function isTodayKst(pubDate: Date, now: Date = new Date()): boolean {
  return isSameCalendarDayKst(pubDate, now);
}

/** 최근 `days`일 이내(현재 시각 기준 롤링). */
export function isWithinRollingDays(
  pubDate: Date,
  days: number,
  now: Date = new Date(),
): boolean {
  const ms = days * 24 * 60 * 60 * 1000;
  return (
    pubDate.getTime() >= now.getTime() - ms &&
    pubDate.getTime() <= now.getTime() + 120_000
  );
}

export function parseNaverPubDate(pubDate: string): Date {
  return new Date(pubDate);
}
