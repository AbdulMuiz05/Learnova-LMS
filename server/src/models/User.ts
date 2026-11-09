import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'student' | 'admin';

export interface IRefreshToken {
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IOtp {
  hash: string;
  expiresAt: Date;
  purpose: 'verify' | 'reset';
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar: { url: string; publicId: string };
  bio: string;
  isVerified: boolean;
  isActive: boolean;
  otp?: IOtp | null;
  refreshTokens: IRefreshToken[];
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const otpSchema = new Schema<IOtp>(
  {
    hash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    purpose: { type: String, enum: ['verify', 'reset'], required: true },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['student', 'admin'], default: 'student', index: true },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    bio: { type: String, default: '', maxlength: 500 },
    isVerified: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    otp: { type: otpSchema, default: null, select: false },
    refreshTokens: { type: [refreshTokenSchema], default: [], select: false },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.password;
        delete ret.otp;
        delete ret.refreshTokens;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function (next) {
  const user = this as unknown as IUser;
  if (!user.isModified('password')) return next();
  user.password = await bcrypt.hash(user.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  const user = this as unknown as IUser;
  return bcrypt.compare(candidate, user.password);
};

export const User = model<IUser>('User', userSchema);
