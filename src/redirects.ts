/**
 * 단축 링크 매핑 테이블
 *
 * 새로운 단축 링크를 추가하려면 아래 객체에 '단축키: 목적지 URL' 형태로 한 줄씩 추가하세요.
 * 주석(//)을 통해 링크에 대한 메모나 설명을 자유롭게 남길 수 있습니다.
 */
export const redirects: Record<string, string> = {
  // 후원
  fairy: "https://fairy.hada.io/@chebread",
  buymeacoffee: "https://buymeacoffee.com/chebread",
  "github-sponsors": "https://github.com/sponsors/chebread/",
  // 서비스
	github: "https://github.com/chebread",
  geeknews: "https://news.hada.io/@chebread",
  velog: "https://velog.io/@haneum",
  stackoverflow: "https://stackoverflow.com/users/16726480/chebread",
  orcid: "https://orcid.org/0009-0003-8673-5891",
  linkedin: "https://www.linkedin.com/in/che-bread/",
  hackernews: "https://news.ycombinator.com/user?id=chebread",
  disquiet: "https://disquiet.io/profiles/mJtpNv",
  codeberg: "https://codeberg.org/chebread",
  okky: "https://okky.kr/users/169353",
  gsap: "https://gsap.com/community/profile/132826-chebread/",
  discord: "https://discord.com/users/1076488742698758225",
  codeforces: "https://codeforces.com/profile/haneum",
  reddit: "https://www.reddit.com/user/Chebread/",
  wikidocs: "https://wikidocs.net/profile/info/book/29663",
  // 커스텀
  resume: "https://chebread.org/about",
  blog: "https://chebread.org",
  email: "mailto:che@chebread.org",
  sponsor: "https://fairy.hada.io/@chebread",
};
