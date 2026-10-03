# link-redirector

`link-redirector` is a high-performance personal Go-links and dynamic QR code generation service built on Cloudflare Workers.

## Features

- **Lightning-Fast Go-Links**: Instant 302 redirects for vanity slugs (e.g. `/github`, `/blog`).
- **Dynamic QR Code Generation (`/qr`)**:
  - Automatically renders an ASCII/Unicode compact QR code in CLI terminals.
  - Automatically delivers an optimized, scalable vector SVG download in web browsers.
- **Intelligent Routing**: Supports vanity slugs (`/qr/github`), full URLs (`/qr/https://...`), and arbitrary text (`/qr/hello`).
- **Safe Query Fallback**: Use `?url=` or `?text=` to encode complex strings without path-mangling or URL-encoding conflicts.
- **Terminal Theme Awareness**: Support for dark and light terminal backgrounds (`?light` / `?invert`).
- **Standard-Compliant Content-Disposition**: Full RFC 6266 and RFC 5987 (`filename*=UTF-8''...`) support with strict ByteString sanitization for multi-byte Unicode/Korean filenames.
- **Pure JavaScript & Zero Native Overhead**: Powered by `uqr`, executing within Cloudflare Workers V8 isolates with sub-millisecond execution and zero external network calls.

---

## 1. Shortlink Redirection (Go-Links)

### Configuration
Add your custom slug and target URL in [`src/redirects.ts`](src/redirects.ts):

```typescript
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
```

### Behavior
- `https://link.chebread.org/<slug>`: 302 redirects to the destination URL.
- Paths are case-insensitive and trim slashes (e.g. `/GITHUB/` -> `https://github.com/chebread`).
- Unmatched slugs or root `/` redirect to `https://chebread.org`.

---

## 2. Dynamic QR Code Service (`/qr`)

### Routing Options

| Format | Example | Description |
| :--- | :--- | :--- |
| `/qr/<slug>` | `/qr/github` | Encodes the destination URL mapped to the slug in `redirects.ts`. |
| `/qr/<url>` | `/qr/https://chebread.org` | Encodes the specified target URL directly. |
| `/qr/<text>` | `/qr/hello-world` | Encodes arbitrary text or payloads (e.g., Wi-Fi configurations). |
| `/qr?url=<target>` | `/qr?url=https://example.com?foo=1&bar=2` | Safe query parameter for URLs containing queries or hashes. |
| `/qr?text=<raw>` | `/qr?text=Contact:+12345678` | Safe query parameter for arbitrary raw or multi-line text. |

### Query Parameters

| Parameter | Values | Description |
| :--- | :--- | :--- |
| `url` | URL string | Target URL to encode into the QR code (recommended for URLs with query strings). |
| `text` (or `target`, `q`) | string | Text payload to encode into the QR code. |
| `format` (or `type`) | `svg`, `image` | Force output format to vector SVG (overrides terminal auto-detection). |
| `format` (or `type`) | `terminal`, `ascii`, `text` | Force output format to terminal Unicode half-blocks. |
| `light`, `invert`, `theme=light` | flag / `light` | Inverts black/white block modules for terminals with white/light backgrounds. |

---

## 3. CLI & Terminal Usage

When requested via `curl`, `wget`, `httpie`, `xh`, or `powershell` (or with `Accept: text/plain`), the worker outputs a 2-in-1 Unicode half-block QR code directly into stdout.

### Examples

#### Render QR for a saved redirect slug:
```bash
curl -sL https://link.chebread.org/qr/github
```

#### Render QR for light-background terminals:
```bash
curl -sL "https://link.chebread.org/qr/github?light"
# or
curl -sL "https://link.chebread.org/qr/github?invert"
```

#### Render QR for an arbitrary URL:
```bash
curl -sL "https://link.chebread.org/qr/https://chebread.org"
```

#### Render QR with safe query parameters (avoids shell & URL path issues):
```bash
curl -sL "https://link.chebread.org/qr?url=https://example.com/search?q=cloudflare&lang=en"
curl -sL "https://link.chebread.org/qr?text=WIFI:S:MyNetwork;T:WPA;P:SecretPassword;;"
```

#### Download SVG via curl:
```bash
curl -sL "https://link.chebread.org/qr/github?format=svg" -o qr-github.svg
# or using Accept header
curl -sL -H "Accept: image/svg+xml" https://link.chebread.org/qr/github -o qr-github.svg
```

---

## 4. Web Browser Usage

When visited from a standard web browser (Chrome, Safari, Firefox), the service returns an optimized SVG file served as a download attachment:

- **Clean File Naming**: `/qr/github` triggers download of `qr-github.svg`.
- **Sanitized Filenames**: Paths and unsafe characters are stripped into safe tokens (e.g. `/qr/https://example.com` becomes `qr-https_example.com.svg`).
- **Unicode Support (RFC 5987)**: Multi-byte languages (such as Korean) download with their original name preserved via `filename*=UTF-8''...` (e.g. `/qr/안녕하세요` -> `qr-안녕하세요.svg`).

---

## 5. Development & Deployment

### Local Development
```bash
pnpm dev
# or: cf dev
```

### Type Checking
```bash
pnpm run typecheck
```

### Test Suite
Runs worker bundle integration tests (verifies redirects, Unicode QR rendering, SVG output, and security edge cases via `node:test` and `jsqr`):
```bash
pnpm test
```

### Deploy
```bash
pnpm run deploy
# or: cf deploy
```

---

## License

This project is licensed under the [Hippocratic License 3.0 (HL3.0)](LICENSE).

