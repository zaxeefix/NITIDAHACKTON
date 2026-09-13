import { clearSessionCookie } from "../../../native-auth";
import { mutationAllowed } from "../../../../db/security";

export async function POST(request: Request) {
  if (!mutationAllowed(request)) return Response.json({ error: "Cross-site sign-out rejected" }, { status: 403 });
  return Response.json({ ok: true }, { headers: { "set-cookie": clearSessionCookie(), "cache-control": "no-store" } });
}
