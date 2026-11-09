import { Schema, model, Document, Types } from 'mongoose';

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderProvider = 'stripe' | 'demo' | 'free';

export interface IOrder extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  course: Types.ObjectId;
  amount: number;
  originalAmount: number;
  currency: string;
  status: OrderStatus;
  provider: OrderProvider;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  invoiceNumber?: string | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    originalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'usd', lowercase: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    provider: { type: String, enum: ['stripe', 'demo', 'free'], required: true },
    // Sparse-unique: must stay undefined (not null) when absent, otherwise every
    // order without a Stripe session / invoice would collide on the same index key.
    stripeSessionId: { type: String, unique: true, sparse: true },
    stripePaymentIntentId: { type: String },
    invoiceNumber: { type: String, unique: true, sparse: true },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });

export const Order = model<IOrder>('Order', orderSchema);
