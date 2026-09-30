import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface TransactionAlertEmailProps {
  recipientName?: string;
  referenceCode: string;
  amount: number;
  currency?: string;
  category: string;
  organizationName: string;
  status: string;
  timestamp: string;
}

export const TransactionAlertEmail = ({
  recipientName = "Valued Member",
  referenceCode = "TXN-DEMO1234",
  amount = 1450.0,
  currency = "USD",
  category = "CLOUD_INFRASTRUCTURE",
  organizationName = "Acme Enterprise Solutions",
  status = "COMPLETED",
  timestamp = new Date().toISOString(),
}: TransactionAlertEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Security Alert: High-Value Transaction #{referenceCode} Registered</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={badgeStyle}>SECURITY & COMPLIANCE DISPATCH</Text>
            <Heading style={headingStyle}>Transactional Activity Alert</Heading>
            <Text style={subheadingStyle}>
              Organization: <strong>{organizationName}</strong>
            </Text>
          </Section>

          <Hr style={hrStyle} />

          {/* Details Card */}
          <Section style={cardSection}>
            <Text style={labelStyle}>TRANSACTION AMOUNT</Text>
            <Text style={amountStyle}>
              ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
            </Text>

            <Section style={detailsGrid}>
              <Text style={detailItem}>
                <span style={detailLabel}>Reference Code:</span>{" "}
                <code style={codeSnippet}>{referenceCode}</code>
              </Text>
              <Text style={detailItem}>
                <span style={detailLabel}>Category:</span> {category}
              </Text>
              <Text style={detailItem}>
                <span style={detailLabel}>Status:</span>{" "}
                <span style={statusBadge}>{status}</span>
              </Text>
              <Text style={detailItem}>
                <span style={detailLabel}>Timestamp:</span> {timestamp}
              </Text>
            </Section>
          </Section>

          <Text style={noticeText}>
            Hello {recipientName}, this transactional notification was triggered automatically
            following an authorized database mutation via Prisma ORM. If this transaction was not
            initiated by your team, notify your System Administrator immediately.
          </Text>

          <Hr style={hrStyle} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Financial Transaction Alert System • Next.js & Resend Pipeline
            </Text>
            <Text style={footerSubtext}>
              Automated Notification Engine • Security & Event Dispatch
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default TransactionAlertEmail;

// --- Styles ---
const mainStyle: React.CSSProperties = {
  backgroundColor: "#f4f6f8",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  padding: "40px 0",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  maxWidth: "580px",
  margin: "0 auto",
  padding: "36px 32px",
};

const headerSection: React.CSSProperties = {
  textAlign: "center" as const,
};

const badgeStyle: React.CSSProperties = {
  backgroundColor: "#eff6ff",
  color: "#2563eb",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  padding: "4px 10px",
  borderRadius: "6px",
  display: "inline-block",
  margin: "0 0 12px 0",
};

const headingStyle: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 8px 0",
};

const subheadingStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: "14px",
  margin: "0",
};

const hrStyle: React.CSSProperties = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
};

const cardSection: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "24px",
  textAlign: "center" as const,
};

const labelStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.5px",
  margin: "0 0 6px 0",
};

const amountStyle: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "36px",
  fontWeight: "800",
  letterSpacing: "-0.5px",
  margin: "0 0 18px 0",
};

const detailsGrid: React.CSSProperties = {
  textAlign: "left" as const,
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "6px",
  padding: "16px",
};

const detailItem: React.CSSProperties = {
  fontSize: "13px",
  color: "#334155",
  margin: "6px 0",
};

const detailLabel: React.CSSProperties = {
  color: "#64748b",
  fontWeight: "600",
  width: "120px",
  display: "inline-block",
};

const codeSnippet: React.CSSProperties = {
  backgroundColor: "#f1f5f9",
  padding: "2px 6px",
  borderRadius: "4px",
  fontFamily: "monospace",
  color: "#0284c7",
  fontWeight: "600",
};

const statusBadge: React.CSSProperties = {
  backgroundColor: "#ecfdf5",
  color: "#059669",
  padding: "2px 8px",
  borderRadius: "9999px",
  fontWeight: "600",
  fontSize: "12px",
};

const noticeText: React.CSSProperties = {
  color: "#475569",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "20px 0 0 0",
};

const footerSection: React.CSSProperties = {
  textAlign: "center" as const,
};

const footerText: React.CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  margin: "0 0 4px 0",
};

const footerSubtext: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "11px",
  margin: "0",
};
