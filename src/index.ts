import { redirects } from "./redirects";
import { handleQrRequest } from "./qr";

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
		// Remove leading slashes: "/github" -> "github"
		const cleanPath = url.pathname.replace(/^\/+/, "");

		// 1. qr.chebread.org: 전용 QR 코드 생성 도메인
		if (hostname === "qr.chebread.org") {
			return handleQrRequest(request, cleanPath);
		}

		// 2. link.chebread.org: 순수 단축 링크 리다이렉트 전용
		if (hostname === "link.chebread.org") {
			// 경로에서 앞뒤 슬래시(/)를 제거하고 소문자로 정규화 (예: "/github/" -> "github")
			const slug = cleanPath.replace(/\/+$/g, "").toLowerCase();

			// 프로토타입 속성(toString 등) 오염 방지: 실제 등록된 단축키인지 안전하게 검사
			if (Object.hasOwn(redirects, slug)) {
				return Response.redirect(redirects[slug], 302);
			}

			// 매칭되는 링크가 없거나 루트(/) 요청 시 메인 블로그로 이동
			return Response.redirect("https://chebread.org", 302);
		}

		// 3. 인가되지 않은 미등록 호스트명(예: a.chebread.org, 임의의 Host 헤더 등) 차단
		return new Response("Not Found", { status: 404 });
	},
};
