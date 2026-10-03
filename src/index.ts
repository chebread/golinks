import { redirects } from "./redirects";
import { handleQrRequest } from "./qr";

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
		// Remove leading slashes: "/github" -> "github", "//qr/github" -> "qr/github"
		const cleanPath = url.pathname.replace(/^\/+/, "");
		const lowerClean = cleanPath.toLowerCase();

		// qr.chebread.org: 전용 QR 코드 생성 도메인
		if (hostname === "qr.chebread.org") {
			let rawTarget: string;
			if (lowerClean === "qr" || lowerClean.startsWith("qr/")) {
				rawTarget = lowerClean === "qr" ? "" : cleanPath.slice(2).replace(/^\/+/, "");
			} else {
				rawTarget = cleanPath;
			}
			return handleQrRequest(request, rawTarget);
		}

		// link.chebread.org (또는 로컬/기타 호스트명):
		// /qr 또는 /qr/ 또는 /qr/<foo> 경로 처리 (대소문자 무관, 다중 선행 슬래시 허용)
		if (lowerClean === "qr" || lowerClean.startsWith("qr/")) {
			const rawTarget = lowerClean === "qr" ? "" : cleanPath.slice(2).replace(/^\/+/, "");
			return handleQrRequest(request, rawTarget);
		}

		// 경로에서 앞뒤 슬래시(/)를 제거하고 소문자로 정규화 (예: "/github/" -> "github")
		const slug = cleanPath.replace(/\/+$/g, "").toLowerCase();

		// 일치하는 단축 슬러그가 있는 경우 해당 목적지로 리다이렉트 (302)
		if (slug in redirects) {
			return Response.redirect(redirects[slug], 302);
		}

		// 매칭되는 링크가 없거나 루트(/) 요청 시 메인 블로그로 이동
		return Response.redirect("https://chebread.org", 302);
	},
};
