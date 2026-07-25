import { Resend } from "resend";
import type { Alert } from "@prisma/client";

export async function sendAlertEmail(alert: Alert): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipients = process.env.ALERT_EMAIL_RECIPIENTS;

  if (!apiKey || !recipients) {
    console.log("Email notification skipped: RESEND_API_KEY or ALERT_EMAIL_RECIPIENTS not configured");
    return;
  }

  const resend = new Resend(apiKey);

  const severityColor = {
    critical: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
  }[alert.severity] || "#6b7280";

  await resend.emails.send({
    from: "IdeaMax Alerts <alerts@resend.dev>",
    to: recipients.split(",").map((e) => e.trim()),
    subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${severityColor}; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 18px;">${alert.title}</h2>
          <span style="font-size: 12px; opacity: 0.9; text-transform: uppercase;">${alert.severity}</span>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">${alert.message}</p>
          ${alert.metricValue ? `<p style="color: #6b7280; font-size: 14px; margin: 0;">Metric value: <strong>${Number(alert.metricValue).toFixed(2)}</strong></p>` : ""}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Generated at ${alert.createdAt.toISOString()} by IdeaMax Marketing
          </p>
        </div>
      </div>
    `,
  });
}
