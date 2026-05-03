import mongoose, { Schema, Document } from 'mongoose';

/**
 * Raw signal payload stored in MongoDB for audit logging.
 * This is the unprocessed signal as received from monitoring agents.
 */
export interface IRawSignal extends Document {
  componentId: string;
  componentType: 'API' | 'RDBMS' | 'CACHE' | 'QUEUE' | 'NOSQL' | 'MCP';
  errorCode: string;
  latencyMs: number;
  payload: Record<string, unknown>;
  receivedAt: Date;
  workItemId?: string;
}

const RawSignalSchema = new Schema<IRawSignal>(
  {
    componentId: { type: String, required: true, index: true },
    componentType: {
      type: String,
      required: true,
      enum: ['API', 'RDBMS', 'CACHE', 'QUEUE', 'NOSQL', 'MCP'],
    },
    errorCode: { type: String, required: true },
    latencyMs: { type: Number, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    receivedAt: { type: Date, default: Date.now, index: true },
    workItemId: { type: String, index: true },
  },
  {
    timestamps: false,
    collection: 'raw_signals',
  }
);

// Compound index for efficient querying
RawSignalSchema.index({ componentId: 1, receivedAt: -1 });
RawSignalSchema.index({ workItemId: 1, receivedAt: -1 });

export const RawSignalModel = mongoose.model<IRawSignal>('RawSignal', RawSignalSchema);
