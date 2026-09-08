# Deployment architecture

```text
Browser -> Vercel frontend -> HTTPS -> Render backend
                                      -> managed database
                                      -> durable evidence object storage
```

The checked-in Cloudflare Sites configuration remains the verified integrated deployment path. The Vercel/Render files are preparation artifacts and require an adapter split before production use because the current Vinext application combines UI and APIs. Production must enforce TLS, trusted origins, platform identity, session expiry/revocation, secrets outside source, managed backups, R2-compatible durable storage, database migrations and health checks. Never use Render's ephemeral filesystem for incident records or evidence.

No deployment has been performed. Account selection, data region, domains, identity assurance, database/storage providers and privacy approval require owner authorization.

## Deployment gate

Run `npm.cmd run release:check` before uploading. The integrated Cloudflare Sites deployment is currently the only path that directly supplies the D1 and R2 bindings used by the code. Vercel plus Render remains a prepared target architecture, not a working production deployment, until the following implementation decisions are supplied:

- Render-compatible managed SQL provider and connection method;
- durable S3/R2-compatible evidence provider;
- production identity provider and verified authentication headers/tokens;
- final Render service URL for the Vercel frontend;
- CORS/CSRF trusted origins and deployment regions;
- migration, backup, retention and malware-scanning services.

Deploying the current `render.yaml` without these services must be treated as a failed preflight, because Render cannot inject Cloudflare D1/R2 bindings and its filesystem is not durable.
