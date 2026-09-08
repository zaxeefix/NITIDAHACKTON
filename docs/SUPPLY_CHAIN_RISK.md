# Supply-chain risk management

Assets include npm packages/lockfile, Vinext/Vite/Cloudflare toolchain, Python runtime, OCR/PDF libraries, model datasets/artefacts, migrations, CI and provider services.

Controls: pinned direct dependencies, lockfile review, `npm ci` for releases, SBOM, provenance/change review, dependency and license scan, secret scan, protected publishing, minimal providers, provider owner/risk/data-sharing records, incident/exit plan and version support policy.

Residual gaps: transitive package signatures/provenance are not independently verified; hosted build/Cloudflare assurance requires vendor evidence; provider contracts and data residency require institutional review.

