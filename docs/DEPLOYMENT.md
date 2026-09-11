# Deployment architecture

```text
Browser -> Vercel frontend -> HTTPS -> Render backend
                                      -> managed database
                                      -> durable evidence object storage
```

The checked-in Cloudflare Workers configuration is the supported no-card test deployment path. Follow [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md). D1 stores structured records and Workers KV stores synthetic test evidence. This KV configuration is not approved for real sensitive evidence; production must use R2 or another approved durable object store with backup, lifecycle and recovery controls. The Vercel/Render files remain preparation artifacts and require an adapter split.

No deployment has been performed. Account selection, data region, domains, identity assurance, database/storage providers and privacy approval require owner authorization.

## Deployment gate

Run `npm.cmd run release:check` before uploading. Cloudflare Workers directly supplies the D1 and Workers KV bindings used by the test deployment. Vercel plus Render remains a prepared target architecture, not a working production deployment, until the following implementation decisions are supplied:

- Render-compatible managed SQL provider and connection method;
- durable S3/R2-compatible evidence provider;
- production identity provider and verified authentication headers/tokens;
- final Render service URL for the Vercel frontend;
- CORS/CSRF trusted origins and deployment regions;
- migration, backup, retention and malware-scanning services.

Deploying the current `render.yaml` without these services must be treated as a failed preflight, because Render cannot inject Cloudflare D1/R2 bindings and its filesystem is not durable.
