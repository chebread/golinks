import { renderSVG, renderUnicodeCompact } from "uqr";
import { redirects } from "./redirects";

/**
 * Checks whether the incoming request is originating from a CLI / terminal
 * environment (e.g. curl, wget, httpie, xh) or explicitly requests text/plain.
 */
export function isTerminalRequest(request: Request, url?: URL): boolean {
	if (url) {
		const format = (
			url.searchParams.get("format") ||
			url.searchParams.get("type") ||
			""
		).toLowerCase();
		if (format === "svg" || format === "image") {
			return false;
		}
		if (
			format === "terminal" ||
			format === "ascii" ||
			format === "text"
		) {
			return true;
		}
	}

	const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
	const accept = (request.headers.get("accept") || "").toLowerCase();

	// If the client explicitly requests SVG or HTML, treat it as a visual/browser client
	if (accept.includes("image/svg+xml") || accept.includes("text/html")) {
		return false;
	}

	// Explicit text/plain request
	if (accept.includes("text/plain")) {
		return true;
	}

	// Common CLI / terminal user agents
	const cliUserAgents = [
		"curl",
		"wget",
		"httpie",
		"http_pie",
		"xh/",
		"curlie",
		"powershell",
		"libcurl",
	];
	if (cliUserAgents.some((cli) => userAgent.includes(cli))) {
		return true;
	}

	return false;
}

/**
 * Checks if terminal request requested an inverted palette for light-background terminals.
 */
export function isLightTerminal(url: URL): boolean {
	return (
		url.searchParams.has("light") ||
		url.searchParams.has("invert") ||
		url.searchParams.get("theme") === "light"
	);
}

/**
 * Sanitizes a string so it can be safely used as a filename base.
 * Replaces characters that are illegal or unsafe across file systems and headers.
 */
export function sanitizeSlug(input: string): string {
	const sanitized = input
		.replace(/[/\\?%*:|"<>;&=\r\n]/g, "_")
		.replace(/\s+/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_+|_+$/g, "");
	return sanitized.slice(0, 60) || "code";
}

/**
 * Builds a RFC 6266 / RFC 5987 compliant Content-Disposition header.
 * Guarantees ByteString safety in HTTP headers while supporting full UTF-8
 * characters (such as Korean) in modern browsers via filename*=UTF-8''<encoded>.
 */
export function buildContentDisposition(filenameSlug: string): string {
	const safeAscii = filenameSlug
		.replace(/[^a-zA-Z0-9._-]/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_+|_+$/g, "")
		.slice(0, 50) || "code";

	const safeUtf8 = filenameSlug
		.replace(/[\r\n"\\;%]/g, "_")
		.replace(/\s+/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_+|_+$/g, "")
		.slice(0, 50) || safeAscii;

	const asciiFilename = `qr-${safeAscii}.svg`;
	const utf8Filename = `qr-${safeUtf8}.svg`;

	if (/^[\x20-\x7E]+$/.test(utf8Filename) && safeAscii === safeUtf8) {
		return `attachment; filename="${asciiFilename}"`;
	}

	return `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(utf8Filename)}`;
}

/**
 * Resolves the raw target string from `/qr/<foo>` into:
 * 1. The actual string to be encoded into the QR code
 *    (destination URL if matching a redirects slug, otherwise raw/decoded text).
 * 2. A sanitized identifier slug for the filename.
 */
export function resolveQrTarget(
	rawTarget: string,
	searchOrUrl: string | URL = "",
): {
	textToEncode: string;
	filenameSlug: string;
} {
	let searchParams: URLSearchParams;
	let searchStr = "";

	if (typeof searchOrUrl === "string") {
		searchStr = searchOrUrl;
		searchParams = new URLSearchParams(
			searchStr.startsWith("?") ? searchStr.slice(1) : searchStr,
		);
	} else {
		searchStr = searchOrUrl.search;
		searchParams = searchOrUrl.searchParams;
	}

	let target = rawTarget.trim();

	let usedQueryFallback = false;
	let isExplicitRawText = false;
	// If rawTarget is empty or contains only slashes, check query params for fallback
	const stripped = target.replace(/^\/+|\/+$/g, "");
	if (!stripped) {
		const rawTextParam = searchParams.get("text");
		if (rawTextParam != null && rawTextParam.trim() !== "") {
			target = rawTextParam.trim();
			isExplicitRawText = true;
			usedQueryFallback = true;
		} else {
			const queryFallback =
				searchParams.get("url") ||
				searchParams.get("target") ||
				searchParams.get("q") ||
				"";
			target = queryFallback.trim();
			if (!target) {
				return {
					textToEncode: "",
					filenameSlug: "code",
				};
			}
			usedQueryFallback = true;
		}
	}

	// Attempt URL decoding for path-based targets (queryFallback is already decoded by searchParams.get)
	let decodedTarget = target;
	if (!usedQueryFallback) {
		try {
			decodedTarget = decodeURIComponent(target);
		} catch {
			decodedTarget = target;
		}
	}

	// Normalize slug for redirect lookup (both decoded and raw lowercase)
	const normalizedSlug = decodedTarget.replace(/^\/+|\/+$/g, "").toLowerCase();

	// If <foo> matches a slug in redirects, encode the destination target URL
	// (Unless explicitly requested as raw text via ?text=)
	if (
		!isExplicitRawText &&
		normalizedSlug &&
		Object.hasOwn(redirects, normalizedSlug)
	) {
		return {
			textToEncode: redirects[normalizedSlug],
			filenameSlug: normalizedSlug,
		};
	}

	if (usedQueryFallback) {
		return {
			textToEncode: target,
			filenameSlug: sanitizeSlug(normalizedSlug || target || "code"),
		};
	}

	// Worker control parameters that should not be forwarded into destination URLs
	const workerParams = new Set([
		"format",
		"type",
		"light",
		"invert",
		"theme",
	]);
	const targetSearchParams = new URLSearchParams();
	for (const [key, value] of searchParams.entries()) {
		if (!workerParams.has(key.toLowerCase())) {
			targetSearchParams.append(key, value);
		}
	}

	const isUrl =
		decodedTarget.startsWith("http://") ||
		decodedTarget.startsWith("https://") ||
		decodedTarget.includes("://");

	let textToEncode = decodedTarget;
	if (isUrl) {
		const paramStr = targetSearchParams.toString();
		if (paramStr) {
			const joinChar = decodedTarget.includes("?") ? "&" : "?";
			textToEncode = `${decodedTarget}${joinChar}${paramStr}`;
		}
	}

	const filenameSlug = sanitizeSlug(normalizedSlug || decodedTarget || "code");

	return {
		textToEncode,
		filenameSlug,
	};
}

/**
 * Handles requests for `/qr/<foo>`.
 * Returns an ASCII/Unicode QR code for terminal requests,
 * or an SVG attachment for browser requests.
 */
export function handleQrRequest(
	request: Request,
	rawTarget: string,
): Response {
	const url = new URL(request.url);
	const { textToEncode, filenameSlug } = resolveQrTarget(rawTarget, url);

	// Handle empty <foo> or targets consisting only of slashes/whitespace
	if (!textToEncode.trim()) {
		const isQrHost =
			url.hostname.toLowerCase().replace(/\.$/, "") === "qr.chebread.org";
		const prefix = isQrHost ? "" : "/qr";
		return new Response(
			`Missing content for QR code.\n\nUsage: ${prefix}/<slug or text or url>\nExamples:\n  ${prefix}/github\n  ${prefix}/https://chebread.org\n  ${prefix}/hello-world\n`,
			{
				status: 400,
				headers: {
					"Content-Type": "text/plain; charset=utf-8",
				},
			},
		);
	}

	const isTerminal = isTerminalRequest(request, url);

	try {
		if (isTerminal) {
			const invert = isLightTerminal(url);
			// Terminal output: Unicode compact half-block QR code
			const terminalQr = renderUnicodeCompact(textToEncode, {
				border: 2,
				ecc: "M",
				boostEcc: true,
				invert,
			});

			return new Response(`${terminalQr}\n`, {
				status: 200,
				headers: {
					"Content-Type": "text/plain; charset=utf-8",
				},
			});
		}

		// Browser output: SVG file as attachment download
		const svg = renderSVG(textToEncode, {
			border: 4,
			ecc: "M",
			boostEcc: true,
		});

		const contentDisposition = buildContentDisposition(filenameSlug);

		return new Response(svg, {
			status: 200,
			headers: {
				"Content-Type": "image/svg+xml; charset=utf-8",
				"Content-Disposition": contentDisposition,
			},
		});
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : "Failed to generate QR code";
		return new Response(`Error generating QR code: ${message}\n`, {
			status: 400,
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
			},
		});
	}
}
