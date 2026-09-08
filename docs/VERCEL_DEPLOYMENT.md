# Vercel preparation

The frontend target is prepared but not deployed. Before deployment, separate browser-facing pages from Worker-specific APIs, set the backend base URL to an HTTPS allowlisted Render origin, configure security headers and trusted production metadata origin, then run the Vercel build and an authenticated smoke test. Do not expose D1/R2 bindings or secrets to browser code.
