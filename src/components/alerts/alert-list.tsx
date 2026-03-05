"use client";

import { AlertCard } from "./alert-card";

interface AlertData {
  id: string;
  ruleType: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
}

interface AlertListProps {
  alerts: AlertData[];
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export function AlertList({ alerts, onAcknowledge, onDismiss }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium mb-1">No alerts</p>
        <p className="text-sm">All metrics are within normal thresholds.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          {...alert}
          onAcknowledge={onAcknowledge}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
