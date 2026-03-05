"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertBadge } from "./alert-badge";
import { Check, X } from "lucide-react";
import { format } from "date-fns";

interface AlertCardProps {
  id: string;
  ruleType: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export function AlertCard({
  id,
  severity,
  title,
  message,
  status,
  createdAt,
  onAcknowledge,
  onDismiss,
}: AlertCardProps) {
  return (
    <Card className={status !== "active" ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <AlertBadge severity={severity} />
              <span className="text-xs text-muted-foreground">
                {format(new Date(createdAt), "MMM dd, yyyy HH:mm")}
              </span>
            </div>
            <h3 className="font-medium text-sm mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          {status === "active" && (
            <div className="flex gap-1 shrink-0">
              {onAcknowledge && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onAcknowledge(id)}
                  title="Acknowledge"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onDismiss(id)}
                  title="Dismiss"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
