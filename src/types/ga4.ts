export interface Ga4ReportRow {
  date: string;
  channelGroup: string;
  sourceMedium: string | null;
  campaignName: string | null;
  sessions: number;
  users: number;
  newUsers: number;
  engagedSessions: number;
  purchaseEvents: number;
  purchaseRevenue: number;
}
