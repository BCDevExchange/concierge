import { createdAtSchema, updatedAtSchema } from 'back-end/lib/schemas';
import bcrypt from 'bcrypt';
import * as mongoose from 'mongoose';
import { Profile } from 'shared/lib/types';
import { Omit } from 'shared/lib/types';

export const NAME = 'User';

export interface Data {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  passwordHash: string;
  acceptedTermsAt?: Date;
  // Is the user account active or not?
  // Deleting a user account marks it as inactive (`active = false`).
  active: boolean;
  profile: Profile;
}

export type PublicUser = Omit<Data, 'passwordHash'> & { passwordHash: undefined };

export function makePublicUser(user: Data): PublicUser {
  return {
    _id: user._id,
    email: user.email,
    active: user.active,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    acceptedTermsAt: user.acceptedTermsAt,
    passwordHash: undefined
  };
}

export interface Model extends mongoose.Model<Data & mongoose.Document> {
  authenticate(user: InstanceType<Model>, password: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
}

export const schema: mongoose.Schema = new mongoose.Schema({
  createdAt: createdAtSchema,
  updatedAt: updatedAtSchema,
  email: {
    type: String,
    required: true,
    unique: true,
    validate: /^[^\s@]+@[^\s@]+.[^\s@]$/i
  },
  passwordHash: {
    type: String,
    required: true
  },
  acceptedTermsAt: Date,
  active: {
    type: Boolean,
    required: true,
    default: true
  },
  profile: mongoose.Schema.Types.Mixed
});

schema.statics.authenticate = (user: InstanceType<Model>, password: string): Promise<boolean> => {
  return (async () => {
    return await bcrypt.compare(password, user.passwordHash);
  })();
};

schema.statics.hashPassword = (password: string): Promise<string> => {
  return (async () => {
    return await bcrypt.hash(password, 10);
  })();
};
