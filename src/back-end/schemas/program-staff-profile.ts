import { createdAtSchema, phoneTypeSchema, updatedAtSchema } from 'back-end/lib/schemas';
import * as mongoose from 'mongoose';
import { PhoneType } from 'shared/lib/types';

export const NAME = 'ProgramStaffProfile';

export interface Data {
  firstName?: string;
  lastName?: string;
  positionTitle?: string;
  contactStreetAddress?: string;
  contactCity?: string;
  contactProvince?: string;
  contactPostalCode?: string;
  contactCountry?: string;
  contactPhoneNumber?: string;
  contactPhoneCountryCode?: string;
  contactPhoneType?: PhoneType;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document extends Data, mongoose.Document {
}

export type Model = mongoose.Model<Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  positionTitle: String,
  contactStreetAddress: String,
  contactCity: String,
  contactProvince: String,
  contactPostalCode: String,
  contactCountry: String,
  contactPhoneNumber: String,
  contactPhoneCountryCode: String,
  contactPhoneType: phoneTypeSchema,
  createdAt: createdAtSchema,
  updatedAt: updatedAtSchema
});
