# link-redirector

`link-redirector` is my personal Go-links service.

## Usage

### 1. Add or Update Links
Add your custom slug and target URL in [`src/redirects.ts`](src/redirects.ts):

```typescript
export const redirects: Record<string, string> = {
  github: "https://github.com/chebread",
  blog: "https://chebread.org",
};
```

### 2. Local Development
```bash
cf dev
```

### 3. Deploy
```bash
cf deploy
```

## License

This project is licensed under the [Hippocratic License 3.0 (HL3.0)](LICENSE).
