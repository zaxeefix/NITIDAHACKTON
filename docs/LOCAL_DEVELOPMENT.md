# Local development

## Windows PowerShell

1. Install Node.js 22.13 or newer.
2. Open PowerShell in the project folder.
3. Run `npm.cmd install`.
4. Run `Copy-Item local.env.example .dev.vars`.
5. Run `npm.cmd run local:setup` to apply D1 migrations.
6. Run `npm.cmd run dev`.
7. Open the printed URL, normally `http://localhost:5173`.
8. Confirm the development-identity warning is visible.
9. Open Judge Mode and use only synthetic reports.
10. Stop with `Ctrl+C`.

`npm.cmd` intentionally bypasses the blocked `npm.ps1` wrapper without changing PowerShell execution policy. The local development identity is fail-closed unless both development flags are present. Local D1/R2 state is under `.wrangler/`.

Verify with `npm.cmd test` and `npm.cmd run lint`. Python regeneration needs Python 3.10+; checked-in artefacts can be used without Python.
