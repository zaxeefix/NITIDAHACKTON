# Cloudflare deployment guide

This is the supported no-card testing path for Triage247Ng. The application,
API, D1 database and Workers KV test-evidence namespace stay in one Cloudflare
account. Use synthetic demonstration evidence only; move to R2 or another
approved object store before handling real sensitive evidence.

## 1. Create and secure the account

1. Open <https://dash.cloudflare.com/sign-up> and create an account.
2. Verify the email address and enable two-factor authentication under **My
   Profile > Authentication**.
3. Do not paste API tokens, recovery codes or passwords into this repository.

## 2. Prepare Windows

1. Install Git and Node.js 22 or newer.
2. Open **Command Prompt** or PowerShell.
3. Clone the repository and enter it:

   ```powershell
   git clone https://github.com/zaxeefix/NITIDAHACKTON.git
   cd NITIDAHACKTON
   npm.cmd ci
   ```

4. Run the checks:

   ```powershell
   npm.cmd test
   npm.cmd run lint
   ```

## 3. Sign Wrangler in to Cloudflare

1. Run:

   ```powershell
   npx.cmd wrangler login
   ```

2. A browser opens. Select the correct Cloudflare account and approve Wrangler.
3. Confirm the account:

   ```powershell
   npm.cmd run cf:whoami
   ```

## 4. Evidence storage for the no-card test deployment

Workers KV is included with the Workers Free plan and does not require R2
billing activation. The first deployment provisions the `EVIDENCE` namespace
automatically. Its free-plan limits make this configuration suitable for
testing, not an institutional evidence repository.

## 5. Perform the first deployment

The checked-in `wrangler.jsonc` uses the `DB` D1 binding and `EVIDENCE`
Workers KV binding. Before publishing for the first time, open **Workers &
Pages** in the Cloudflare dashboard and complete **Workers onboarding** to
choose the free account-wide `workers.dev` subdomain.

1. Deploy once to provision the Worker and storage:

   ```powershell
   npm.cmd run deploy:cloudflare
   ```

2. Keep the `database_id`, `database_name` and `bucket_name` values that Wrangler
   writes to `wrangler.jsonc`. Commit those non-secret resource identifiers.
3. Apply every database migration:

   ```powershell
   npm.cmd run db:migrate:remote
   ```

4. Deploy again so the application starts against the migrated database:

   ```powershell
   npm.cmd run deploy:cloudflare
   ```

5. Record the printed `https://triage247ng.<subdomain>.workers.dev` address.

## 6. Protect the application with Cloudflare Access

Do not use the production application before this step. Triage247Ng trusts the
identity header inserted by Cloudflare Access.

1. Open **Workers & Pages**, select **triage247ng**, then select **Access**.
2. Select **Enable Access** for production and preview traffic.
3. If prompted, create a Cloudflare Zero Trust team name.
4. Create an **Allow** policy for the exact administrator email address. Avoid an
   `Everyone` or public bypass rule.
5. Choose email one-time PIN as the identity provider, or connect the approved
   organisational identity provider.
6. Set a short session duration for administrative access and save the policy.
7. Open the Worker URL in a private browser window. Cloudflare must show its
   authentication screen before the application loads.
8. In `wrangler.jsonc`, change `TRIAGENG_TRUST_CLOUDFLARE_ACCESS` from `false`
   to `true`, then run `npm.cmd run deploy:cloudflare` again. Never enable this
   setting before the Access policy is protecting production traffic.

The first authenticated person to open the newly migrated database becomes the
Administrator. Every later authenticated person is created as a Reporter. The
Administrator assigns Analyst, Senior Analyst, Auditor or Administrator roles
from **Users & Roles**.

## 7. Verify the deployment

1. Sign in with the administrator email allowed by Access.
2. Confirm **Users & Roles** appears in the administration navigation.
3. Submit a synthetic test incident; never start with real personal data.
4. Refresh the page and confirm the incident remains present.
5. Upload a harmless sample image and confirm its attachment metadata appears.
6. Open `/api/readiness` while signed in and confirm a successful JSON response.
7. Review **Workers & Pages > triage247ng > Observability > Logs** for errors.
8. Review **Storage & databases > D1** and **Workers KV** to confirm records and
   test-evidence keys.

## 8. Add more users

1. Add each permitted email to the Cloudflare Access Allow policy.
2. Ask that person to open the Worker URL and complete sign-in once.
3. Sign in as Administrator and open **Users & Roles**.
4. Assign only the role needed for their work.

Cloudflare Access controls who can reach the application. Triage247Ng roles
control what an authenticated person can do inside it. Both layers are required.

## 9. Deploy future updates

```powershell
git pull
npm.cmd ci
npm.cmd test
npm.cmd run db:migrate:remote
npm.cmd run deploy:cloudflare
```

Apply only new, reviewed migrations. Never rewrite a migration already applied
to production. Use synthetic data until institutional security, privacy,
retention, incident-response and backup approvals are complete.

## 10. Optional GitHub automatic deployment

After the first successful manual deployment, Cloudflare can import the GitHub
repository from **Workers & Pages > Create > Import a repository**. Use
`npm ci && npm run build` as the build command and `npx wrangler deploy` as the
deploy command. Store tokens only in Cloudflare or GitHub secret settings.

Manual deployment is recommended for the first release because the D1
migrations must be reviewed and applied deliberately.

## Troubleshooting

- `npm.ps1 cannot be loaded`: use `npm.cmd` and `npx.cmd` in PowerShell.
- `Authentication required`: confirm Access protects production traffic and the
  login email is allowed by its policy.
- `no such table`: run `npm.cmd run db:migrate:remote` against the correct account.
- `DB binding unavailable`: confirm `wrangler.jsonc` contains the provisioned D1
  binding named `DB`, then rebuild and redeploy.
- `EVIDENCE binding unavailable`: confirm the KV namespace binding is named
  `EVIDENCE`, then rebuild and redeploy.
- Upload or database data missing: confirm the deployed Worker uses the intended
  D1 database and Workers KV namespace rather than a local Wrangler resource.
