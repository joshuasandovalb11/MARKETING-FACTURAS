interface NormalizationStats {
  source: string;
  total: number;
  kept: number;
}

export function logNormalizationStats({
  source,
  total,
  kept,
}: NormalizationStats) {
  if (!import.meta.env.DEV) return;

  const dropped = Math.max(total - kept, 0);
  if (dropped <= 0) return;

  console.warn(
    `[normalize] source=${source} total=${total} kept=${kept} dropped=${dropped}`
  );
}
