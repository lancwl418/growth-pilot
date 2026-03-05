export interface ForecastPoint {
  date: string;
  predicted: number;
  actual: number | null;
  deviation: number | null;
  isFuture: boolean;
}

export interface ForecastResponse {
  forecasts: ForecastPoint[];
  deviationAlerts: { date: string; deviation: number }[];
  metric: string;
}
