import evaluation from "../../data/model-evaluation.json";
import ocrEvaluation from "../../data/ocr-evaluation.json";
import reports from "../../data/labelled-reports.json";
import { getChatGPTUser } from "../../chatgpt-auth";

function csvCell(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Authentication required" }, { status: 401 });
  const type = new URL(request.url).searchParams.get("type") || "evaluation";
  if (type === "dataset") {
    const columns = [
      "id",
      "language",
      "text",
      "category",
      "severity",
      "route",
    ] as const;
    const content = [
      columns.join(","),
      ...reports.map((row) =>
        columns.map((column) => csvCell(row[column])).join(","),
      ),
    ].join("\n");
    return new Response(content, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition":
          "attachment; filename=triageng-labelled-answer-key.csv",
      },
    });
  }
  if (type === "ocr-dataset") {
    const columns = [
      "id",
      "language",
      "difficulty",
      "groundTruth",
      "ocrText",
      "characterAccuracy",
      "wordAccuracy",
      "privacyExpected",
      "privacyDetected",
    ] as const;
    const content = [
      columns.join(","),
      ...ocrEvaluation.cases.map((row) =>
        columns.map((column) => csvCell(row[column])).join(","),
      ),
    ].join("\n");
    return new Response(content, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition":
          "attachment; filename=triageng-ocr-answer-key.csv",
      },
    });
  }
  if (type === "ocr")
    return new Response(JSON.stringify(ocrEvaluation, null, 2), {
      headers: {
        "content-type": "application/json",
        "content-disposition":
          "attachment; filename=triageng-ocr-evaluation.json",
      },
    });
  return new Response(JSON.stringify(evaluation, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition":
        "attachment; filename=triageng-evaluation-report.json",
    },
  });
}
