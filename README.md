# golinks

`golinks` is a high-performance personal Go-links and dynamic QR code generation service built on Cloudflare Workers.

> [!IMPORTANT]
> **Public by Design (Security Notice)**  
> This service is architected as an unauthenticated, publicly accessible gateway. Any link configured on `link.chebread.org` and any QR code generated on `qr.chebread.org` can be resolved by anyone on the internet.  
> 
> **Never store or route confidential credentials, API keys, passwords, private tokens, Wi-Fi credentials, or sensitive documents through this service.** Only register destinations and text intended for public sharing.

## Features

- **Dual Subdomain Architecture**:
  - `link.chebread.org`: Instant 302 redirects for vanity slugs (e.g. `/github`, `/blog`).
  - `qr.chebread.org`: Dedicated subdomain for instant QR generation directly from path (e.g. `/github`, `/hello`, `/https://...`).
- **Dynamic QR Code Generation**:
  - Automatically renders an ASCII/Unicode compact QR code in CLI terminals.
  - Automatically delivers an optimized, scalable vector SVG download in web browsers.
- **Intelligent Routing**: Supports vanity slugs (`/github`), full URLs (`/https://...`), and arbitrary text (`/hello`).
- **Safe Query Fallback**: Use `?url=` or `?text=` to encode complex strings without path-mangling or URL-encoding conflicts.
- **Terminal Theme Awareness**: Support for dark and light terminal backgrounds (`?light` / `?invert`).
- **Standard-Compliant Content-Disposition**: Full RFC 6266 and RFC 5987 (`filename*=UTF-8''...`) support with strict ByteString sanitization for multi-byte Unicode/Korean filenames.
- **Pure JavaScript & Zero Native Overhead**: Powered by `uqr`, executing within Cloudflare Workers V8 isolates with sub-millisecond execution and zero external network calls.

---

## 1. Subdomain Overview

| Subdomain | Purpose | Path Example | Result |
| :--- | :--- | :--- | :--- |
| **`qr.chebread.org`** | **Instant QR Code Generation** | `https://qr.chebread.org/github` | Renders/downloads QR code for `https://github.com/chebread` |
| | | `https://qr.chebread.org/hello` | Renders/downloads QR code for text `"hello"` |
| | | `https://qr.chebread.org/https://example.com` | Renders/downloads QR code for URL `"https://example.com"` |
| | | `https://qr.chebread.org/?url=...` | Renders/downloads QR code from query parameter |
| **`link.chebread.org`** | **Go-Links (URL Redirection)** | `https://link.chebread.org/github` | 302 Redirect to `https://github.com/chebread` |
| | | `https://link.chebread.org/` | 302 Redirect to `https://chebread.org` |

---

## 2. Shortlink Redirection (`link.chebread.org`)

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

## 3. Dynamic QR Code Service (`qr.chebread.org`)

### Routing Options

| Format | Example | Description |
| :--- | :--- | :--- |
| `/<slug>` | `https://qr.chebread.org/github` | Encodes destination URL mapped in `redirects.ts`. |
| `/<url>` | `https://qr.chebread.org/https://chebread.org` | Encodes the specified target URL directly. |
| `/<text>` | `https://qr.chebread.org/hello-world` | Encodes arbitrary text or payloads. |
| `/?url=<target>` | `https://qr.chebread.org/?url=https://example.com?foo=1` | Safe query parameter for complex URLs. |
| `/?text=<raw>` | `https://qr.chebread.org/?text=github` | Explicit raw text parameter (skips slug redirect lookup). |

### Query Parameters

| Parameter | Values | Description |
| :--- | :--- | :--- |
| `url` | URL string | Target URL to encode into the QR code (recommended for URLs with query strings). |
| `text` (or `target`, `q`) | string | Text payload to encode into the QR code. |
| `format` (or `type`) | `svg`, `image` | Force output format to vector SVG (overrides terminal auto-detection). |
| `format` (or `type`) | `terminal`, `ascii`, `text` | Force output format to terminal Unicode half-blocks. |
| `light`, `invert`, `theme=light` | flag / `light` | Inverts black/white block modules for terminals with white/light backgrounds. |

---

## 4. CLI & Terminal Usage

When requested via `curl`, `wget`, `httpie`, `xh`, or `powershell` (or with `Accept: text/plain`), the worker outputs a 2-in-1 Unicode half-block QR code directly into stdout.

### Examples

#### Render QR on dedicated domain `qr.chebread.org`:
```bash
# Saved redirect slug
curl -sL https://qr.chebread.org/github

# Arbitrary text
curl -sL https://qr.chebread.org/hello-world

# Arbitrary URL
curl -sL https://qr.chebread.org/https://chebread.org
```

#### Render QR for light-background terminals:
```bash
curl -sL "https://qr.chebread.org/github?light"
# or
curl -sL "https://qr.chebread.org/github?invert"
```

#### Render QR with safe query parameters (avoids shell & URL path issues):
```bash
curl -sL "https://qr.chebread.org/?url=https://example.com/search?q=cloudflare&lang=en"
curl -sL "https://qr.chebread.org/?text=WIFI:S:MyNetwork;T:WPA;P:SecretPassword;;"
```

#### Download SVG via curl:
```bash
curl -sL "https://qr.chebread.org/github?format=svg" -o qr-github.svg
# or using Accept header
curl -sL -H "Accept: image/svg+xml" https://qr.chebread.org/github -o qr-github.svg
```

---

## 5. Web Browser Usage

When visited from a standard web browser (Chrome, Safari, Firefox), the service returns an optimized SVG file served as a download attachment:

- **Instant Download via `qr.chebread.org`**:
  - `https://qr.chebread.org/github` triggers download of `qr-github.svg`.
  - `https://qr.chebread.org/hello` triggers download of `qr-hello.svg`.
- **Clean File Naming**: `/github` triggers download of `qr-github.svg`.
- **Sanitized Filenames**: Paths and unsafe characters are stripped into safe tokens (e.g. `/https://example.com` becomes `qr-https_example.com.svg`).
- **Unicode Support (RFC 5987)**: Multi-byte languages (such as Korean) download with their original name preserved via `filename*=UTF-8''...` (e.g. `/안녕하세요` -> `qr-안녕하세요.svg`).

---

## 6. Development & Deployment

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

### DNS / CNAME Setup
In Cloudflare DNS for your zone (`chebread.org`), configure CNAME records for both subdomains:
- `link.chebread.org` -> Worker
- `qr.chebread.org` -> Worker

---

## License

This project is licensed under the [Hippocratic License 3.0 (HL3.0)](LICENSE).
