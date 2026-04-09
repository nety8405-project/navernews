# 실시간 뉴스를 확인해보자 · AI 인사이트

네이버 뉴스 검색 API로 최신 기사를 가져온 뒤, OpenAI로 **요약·키워드·맥락 감정·트렌드 인사이트**를 정리하는 [Next.js](https://nextjs.org) 앱입니다. API 키는 **서버 라우트에서만** 사용하며, 저장소에는 **절대 넣지 마세요**.

- **GitHub:** [github.com/nety8405-project/navernews](https://github.com/nety8405-project/navernews)

## 필요 환경

- Node.js 20+ 권장
- [네이버 개발자 센터](https://developers.naver.com/apps) 애플리케이션 (뉴스 검색 API 사용)
- [OpenAI API](https://platform.openai.com/api-keys) 키

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 (로컬)

루트에 **`.env.local`** 파일을 만들고 값을 넣습니다. 이 파일은 `.gitignore`에 포함되어 Git에 올라가지 않습니다.

```bash
cp .env.example .env.local
```

`.env.example` 항목:

| 변수 | 설명 |
|------|------|
| `NAVER_CLIENT_ID` | 네이버 앱 Client ID |
| `NAVER_CLIENT_SECRET` | 네이버 앱 Client Secret |
| `OPENAI_API_KEY` | OpenAI API 키 |
| `OPENAI_MODEL` | (선택) 기본값 `gpt-4o-mini` |

⚠️ **공개 저장소·PR·이슈에 키를 붙여넣지 마세요.** 유출 시 즉시 키를 폐기하고 재발급하세요.

### 3. 개발 서버

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다. (포트가 사용 중이면 Next가 다른 포트를 안내합니다.)

### 4. 프로덕션 빌드

```bash
npm run build
npm start
```

## 동작 요약

- **키워드**: 검색어로 네이버 뉴스 `news.json` 조회 → 상위 기사 일부로 분석
- **오늘 / 최근 7일**: 네이버에서 최신순으로 수집한 뒤, KST 당일 또는 롤링 7일로 필터
- 분석은 `POST /api/news`에서 수행되며, 클라이언트에는 **키가 노출되지 않습니다**

## 주요 경로

| 경로 | 역할 |
|------|------|
| `src/app/page.tsx` | 메인 UI |
| `src/app/api/news/route.ts` | 네이버 수집 + OpenAI 분석 API |
| `src/lib/naver-news.ts` | 네이버 뉴스 API 클라이언트 |
| `src/lib/analyze-news.ts` | OpenAI JSON 응답 프롬프트 |
| `src/types/analysis.ts` | 분석 결과 타입 |

## 라이선스

이 저장소는 예시 프로젝트로 제공됩니다. 네이버·OpenAI 등 제3자 서비스 이용 약관을 각각 준수해야 합니다.
