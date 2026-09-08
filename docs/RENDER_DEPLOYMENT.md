# Render preparation

The API target is prepared but not deployed. Use a managed durable database and object store, apply migrations once through an approved release job, set production identity/session and CORS configuration, store secrets in Render's secret manager, and verify `/api/readiness`. The current integrated Vinext runtime needs an explicit frontend/backend adapter split before the Render service is production-ready.
