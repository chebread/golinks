/**
 * 단축 링크 매핑 테이블
 *
 * 새로운 단축 링크를 추가하려면 아래 객체에 '단축키: 목적지 URL' 형태로 한 줄씩 추가하세요.
 * 주석(//)을 통해 링크에 대한 메모나 설명을 자유롭게 남길 수 있습니다.
 */
export const redirects: Record<string, string> = {
	github: "https://github.com/chebread",
  blog: "https://chebread.org",
  email: "mailto:che@chebread.org",
  sponsor: "https://github.com/sponsors/chebread",
  geeknews: "https://news.hada.io/@chebread",
  velog: "https://velog.io/@haneum",
  stackoverflow: "https://stackoverflow.com/users/16726480/chebread",
  orcid: "https://orcid.org/0009-0003-8673-5891",
};
