import artifact from "../data/model-artifact.json";

type Label = keyof typeof artifact.logPriors;

function tokens(text: string) {
  return text.toLowerCase().match(/[a-z0-9]{2,}/g) || [];
}

export function analyseIncident(text: string) {
  const counts = new Map<string, number>();
  for (const token of tokens(text)) counts.set(token, (counts.get(token) || 0) + 1);
  const scores = artifact.labels.map(labelName => {
    const label = labelName as Label;
    const weights = artifact.tokenLogProb[label] as Record<string, number>;
    const unknown = artifact.unknownLogProb[label];
    let score = artifact.logPriors[label];
    for (const [token, count] of counts) score += count * (weights[token] ?? unknown);
    return { label, score };
  }).sort((a, b) => b.score - a.score);
  const best = scores[0];
  const margin = Math.min(best.score - scores[1].score, 12);
  const confidence = Math.round(100 / (1 + Math.exp(-margin)));
  const bestWeights = artifact.tokenLogProb[best.label] as Record<string, number>;
  const evidence = [...counts.keys()]
    .filter(token => token in bestWeights)
    .sort((a, b) => bestWeights[b] - bestWeights[a])
    .slice(0, 5);
  return {
    category: best.label,
    severity: artifact.severityByCategory[best.label],
    route: artifact.routeByCategory[best.label],
    confidence,
    evidence,
    model: `${artifact.model} · Python-trained artefact`,
  };
}

export const modelMetadata = {
  model: artifact.model,
  trainingReports: artifact.trainingReports,
  seed: artifact.seed,
  trainedBy: artifact.trainedBy,
};
