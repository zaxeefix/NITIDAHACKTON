export type LocalOcrResult = {
  text: string;
  confidence: number;
  pageCount: number;
  engine: "Tesseract" | "PDF text layer" | "Hybrid PDF";
};

export type OcrProgress = { progress: number; label: string };

export async function recogniseEvidence(
  file: File,
  onProgress?: (update: OcrProgress) => void,
): Promise<LocalOcrResult> {
  if (file.type === "application/pdf") return recognisePdf(file, onProgress);
  if (!file.type.startsWith("image/"))
    throw new Error("Local OCR supports PNG, JPG and PDF evidence.");
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger(message) {
      if (
        message.status === "recognizing text" &&
        typeof message.progress === "number"
      ) {
        onProgress?.({
          progress: Math.round(message.progress * 100),
          label: "Reading screenshot",
        });
      }
    },
  });
  try {
    const result = await worker.recognize(file);
    const text = result.data.text.replace(/\s+\n/g, "\n").trim();
    if (!text)
      throw new Error("No readable text was detected in this screenshot.");
    return {
      text,
      confidence: Math.round(result.data.confidence),
      pageCount: 1,
      engine: "Tesseract",
    };
  } finally {
    await worker.terminate();
  }
}

async function recognisePdf(
  file: File,
  onProgress?: (update: OcrProgress) => void,
): Promise<LocalOcrResult> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const pdf = await loadingTask.promise;
  const pageCount = Math.min(pdf.numPages, 5);
  const sections: string[] = [];
  const confidences: number[] = [];
  let worker: Awaited<
    ReturnType<(typeof import("tesseract.js"))["createWorker"]>
  > | null = null;
  let usedTextLayer = false;
  let usedOcr = false;
  try {
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      onProgress?.({
        progress: Math.round(((pageNumber - 1) / pageCount) * 100),
        label: `Reading PDF page ${pageNumber} of ${pageCount}`,
      });
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const embedded = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (embedded.length >= 30) {
        sections.push(`Page ${pageNumber}\n${embedded}`);
        confidences.push(100);
        usedTextLayer = true;
        continue;
      }
      usedOcr = true;
      if (!worker)
        worker = await (await import("tesseract.js")).createWorker("eng");
      const viewport = page.getViewport({ scale: 1.6 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context)
        throw new Error("This device could not prepare the PDF page for OCR.");
      await page.render({ canvasContext: context, viewport, canvas }).promise;
      const result = await worker.recognize(canvas);
      const text = result.data.text.replace(/\s+\n/g, "\n").trim();
      if (text) sections.push(`Page ${pageNumber}\n${text}`);
      confidences.push(result.data.confidence);
    }
  } finally {
    await worker?.terminate();
    await loadingTask.destroy();
  }
  const text = sections.join("\n\n").trim();
  if (!text)
    throw new Error(
      "No readable text was detected in the first five PDF pages.",
    );
  onProgress?.({ progress: 100, label: "PDF text ready for privacy review" });
  return {
    text,
    confidence: Math.round(
      confidences.reduce((sum, value) => sum + value, 0) /
        Math.max(confidences.length, 1),
    ),
    pageCount,
    engine:
      usedOcr && usedTextLayer
        ? "Hybrid PDF"
        : usedOcr
          ? "Tesseract"
          : "PDF text layer",
  };
}
