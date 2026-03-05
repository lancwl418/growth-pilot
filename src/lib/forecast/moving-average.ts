/**
 * Calculate 7-day moving average
 */
export function movingAverage(values: number[], window = 7): number {
  if (values.length === 0) return 0;
  const slice = values.slice(-window);
  return slice.reduce((sum, v) => sum + v, 0) / slice.length;
}

/**
 * Calculate day-of-week factor based on historical data.
 * Returns a multiplier: if this weekday typically has 20% more sales than average, returns 1.2
 */
export function dayOfWeekFactor(
  historicalByDow: Map<number, number[]>,
  targetDow: number
): number {
  const allValues: number[] = [];
  const dowValues = historicalByDow.get(targetDow) || [];

  historicalByDow.forEach((values) => allValues.push(...values));

  if (allValues.length === 0 || dowValues.length === 0) return 1.0;

  const overallAvg = allValues.reduce((s, v) => s + v, 0) / allValues.length;
  const dowAvg = dowValues.reduce((s, v) => s + v, 0) / dowValues.length;

  if (overallAvg === 0) return 1.0;

  return dowAvg / overallAvg;
}

/**
 * Generate predictions for the next N days
 */
export function generatePredictions(
  recentValues: number[],
  historicalByDow: Map<number, number[]>,
  startDow: number,
  days = 7
): number[] {
  const ma = movingAverage(recentValues);
  const predictions: number[] = [];

  for (let i = 0; i < days; i++) {
    const dow = (startDow + i) % 7;
    const dowFactor = dayOfWeekFactor(historicalByDow, dow);
    predictions.push(Math.max(0, Math.round(ma * dowFactor * 100) / 100));
  }

  return predictions;
}
