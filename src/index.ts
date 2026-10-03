import { redirects } from "./redirects";
import { handleQrRequest } from "./qr";

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		const lowerPath = url.pathname.toLowerCase();

		// /qr 또는 /qr/ 또는 /qr/<foo> 경로 처리 (대소문자 무관)
		if (lowerPath === "/qr" || lowerPath === "/qr/") {
			return handleQrRequest(request, "");
		}

		if (lowerPath.startsWith("/qr/")) {
			const rawTarget = url.pathname.slice(4);
			return handleQrRequest(request, rawTarget);
		}

		// 경로에서 앞뒤 슬래시(/)를 제거하고 소문자로 정규화 (예: "/github/" -> "github")
		const slug = url.pathname.replace(/^\/+|\/+$/g, "").toLowerCase();

		// 일치하는 단축 슬러그가 있는 경우 해당 목적지로 리다이렉트 (302)
		if (slug in redirects) {
			return Response.redirect(redirects[slug], 302);
		}

		// 매칭되는 링크가 없거나 루트(/) 요청 시 메인 블로그로 이동
		return Response.redirect("https://chebread.org", 302);
	},
};
