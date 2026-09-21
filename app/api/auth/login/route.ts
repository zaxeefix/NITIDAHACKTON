import { clearLoginRateLimit, createSessionCookie, loginRateLimit, verifyAdminCredentials } from "../../../native-auth";
import { mutationAllowed, requestWithinLimit } from "../../../../db/security";

export async function POST(request: Request) {
  if (!mutationAllowed(request)) return Response.json({ error: "Cross-site sign-in rejected" }, { status: 403 });
  if (!requestWithinLimit(request, 8_192)) return Response.json({ error: "Request is too large" }, { status: 413 });
  const rate = await loginRateLimit(request);
  if (!rate.allowed) return Response.json({ error: "Too many sign-in attempts. Try again in 15 minutes." }, { status: 429 });
  let body: { email?: string; password?: string };
  try {
    body = await request.json() as { email?: string; password?: string };
  } catch {
    return Response.json({ error: "Invalid sign-in request" }, { status: 400 });
  }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!await verifyAdminCredentials(email, password)) {
    return Response.json({ error: "Email or password is incorrect" }, { status: 401 });
  }
  await clearLoginRateLimit(rate.key);
  const cookie = await createSessionCookie(email, "Atam Isaiah");
  return Response.json({ ok: true }, { headers: { "set-cookie": cookie, "cache-control": "no-store" } });
}
