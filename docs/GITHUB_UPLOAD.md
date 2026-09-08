# GitHub upload

The repository is initialised on branch `main`. Local secrets, D1/R2 state, dependency folders and build outputs are excluded.

1. Create an empty GitHub repository named `Triage247Ng`; do not add starter files.
2. Run `npm.cmd run release:check`.
3. Review `git status` and confirm no `.dev.vars`, `.env`, `.wrangler`, `node_modules` or real evidence is staged.
4. Commit locally: `git commit -m "Prepare Triage247Ng hackathon release"`.
5. Add the exact GitHub URL: `git remote add origin https://github.com/OWNER/Triage247Ng.git`.
6. Push only after checking the account and repository visibility: `git push -u origin main`.

Do not commit production secrets or real incident data. GitHub Actions runs tests, lint and a dependency audit on pushes and pull requests.
