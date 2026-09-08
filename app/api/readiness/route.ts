import readiness from "../../data/readiness.json";
import { getChatGPTUser } from "../../chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Authentication required" }, { status: 401 });
  return new Response(JSON.stringify(readiness, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition":
        "attachment; filename=triageng-track-d1-readiness.json",
    },
  });
}
