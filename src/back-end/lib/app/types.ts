import * as FeedbackSchema from 'back-end/lib/schemas/feedback';
import * as FileSchema from 'back-end/lib/schemas/file';
import * as ForgotPasswordTokenSchema from 'back-end/lib/schemas/forgot-password-token';
import * as RfiSchema from 'back-end/lib/schemas/request-for-information';
import * as RfiResponseSchema from 'back-end/lib/schemas/request-for-information/response';
import * as SessionSchema from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import { ErrorResponseBody, FileRequestBody, FileResponseBody, JsonRequestBody, JsonResponseBody, TextResponseBody } from 'back-end/lib/server';

export type Session = SessionSchema.Data;

export interface AvailableModels {
  Session: SessionSchema.Model;
  User: UserSchema.Model;
  Feedback: FeedbackSchema.Model;
  ForgotPasswordToken: ForgotPasswordTokenSchema.Model;
  File: FileSchema.Model;
  Rfi: RfiSchema.Model;
  // Use the same code as RFIs for RFI Previews.
  RfiPreview: RfiSchema.Model;
  RfiResponse: RfiResponseSchema.Model;
}

export type SupportedRequestBodies = JsonRequestBody | FileRequestBody;

export type SupportedResponseBodies = JsonResponseBody | FileResponseBody | TextResponseBody | ErrorResponseBody;
