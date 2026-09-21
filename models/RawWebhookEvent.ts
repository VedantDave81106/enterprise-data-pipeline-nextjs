import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRawWebhookEvent extends Document {
  eventId: string;
  provider: string;
  type: string;
  rawPayload: Record<string, any>;
  receivedAt: Date;
  status: string;
}

const RawWebhookEventSchema: Schema = new Schema(
  {
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      default: "Resend",
    },
    type: {
      type: String,
      required: true, // e.g., 'email.delivered', 'email.bounced'
    },
    rawPayload: {
      type: Schema.Types.Mixed,
      required: true, // Stores the unnormalized JSON document telemetry
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      default: "INGESTED",
    },
  },
  {
    timestamps: true,
  }
);

export const RawWebhookEvent: Model<IRawWebhookEvent> =
  mongoose.models.RawWebhookEvent ||
  mongoose.model<IRawWebhookEvent>("RawWebhookEvent", RawWebhookEventSchema);
