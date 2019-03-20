import { AvailableModels, SupportedRequestBodies } from 'back-end/lib/app';
import * as crud from 'back-end/lib/crud';
import * as notifications from 'back-end/lib/mailer/notifications';
import * as permissions from 'back-end/lib/permissions';
import * as SessionSchema from 'back-end/lib/schemas/session';
import { AppSession } from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import { basicResponse, JsonResponseBody, makeJsonResponseBody, mapRequestBody, Response } from 'back-end/lib/server';
import { validateEmail, validatePassword } from 'back-end/lib/validators';
import { get, isBoolean, isObject } from 'lodash';
import * as mongoose from 'mongoose';
import { getBoolean, getString, identityAsync } from 'shared/lib';
import { CreateValidationErrors, PublicUser, UpdateValidationErrors } from 'shared/lib/resources/user';
import { PaginatedList } from 'shared/lib/types';
import { allValid, getInvalidValue, invalid, valid, validateUserType, ValidOrInvalid } from 'shared/lib/validators';
import { validateProfile } from 'shared/lib/validators/profile';

type CreateRequestBody = ValidOrInvalid<UserSchema.Data, CreateValidationErrors>;

type CreateResponseBody = JsonResponseBody<PublicUser | CreateValidationErrors>;

type ReadOneResponseBody = JsonResponseBody<PublicUser | null>;

type ReadManyResponseBody = JsonResponseBody<PaginatedList<PublicUser> | null>;

type UpdateRequestBody = ValidOrInvalid<InstanceType<UserSchema.Model>, UpdateValidationErrors>;

type UpdateResponseBody = JsonResponseBody<PublicUser | UpdateValidationErrors>;

type DeleteResponseBody = JsonResponseBody<null>;

async function validateCreateRequestBody(Model: UserSchema.Model, email: string, password: string, acceptedTerms: boolean, profile: object, createdBy?: mongoose.Types.ObjectId): Promise<CreateRequestBody> {
  const validatedEmail = await validateEmail(Model, email);
  const validatedPassword = await validatePassword(password);
  const validatedProfile = validateProfile(profile);
  const now = new Date();
  if (allValid([validatedEmail, validatedPassword, validatedProfile])) {
    return valid({
      email: validatedEmail.value,
      passwordHash: validatedPassword.value,
      active: true,
      acceptedTermsAt: acceptedTerms ? now : undefined,
      profile: validatedProfile.value,
      createdBy,
      createdAt: now,
      updatedAt: now
    } as UserSchema.Data);
  } else {
    return invalid({
      email: getInvalidValue(validatedEmail, []),
      password: getInvalidValue(validatedPassword, []),
      profile: getInvalidValue(validatedProfile, [])
    });
  }
}

// TODO break this up into smaller functions.
async function validateUpdateRequestBody(Model: UserSchema.Model, id: string, email?: string, profile?: object, acceptedTerms?: boolean, newPassword?: string, currentPassword?: string): Promise<UpdateRequestBody> {
  // Does the user exist? Is their account active?
  const user = await Model.findById(id);
  if (!user || !user.active) {
    return invalid({
      id: ['Your user account does not exist or it is inactive.']
    });
  }
  // Change password.
  if (newPassword && currentPassword) {
    const correctPassword = await UserSchema.authenticate(user, currentPassword);
    const validatedNewPassword = await validatePassword(newPassword);
    if (correctPassword && validatedNewPassword.tag === 'valid') {
      user.passwordHash = validatedNewPassword.value
    } else {
      return invalid({
        currentPassword: correctPassword ? [] : ['Please enter your correct password.'],
        password: getInvalidValue(validatedNewPassword, [])
      });
    }
  }
  // Accepted terms?
  const now = new Date();
  if (!user.acceptedTermsAt && acceptedTerms) {
    user.acceptedTermsAt = now;
  } else if (user.acceptedTermsAt && acceptedTerms === false) {
    return invalid({
      acceptedTerms: ['You cannot un-accept the terms.']
    });
  }
  // Email.
  email = email && email.trim();
  if (email && user.email !== email) {
    const validatedEmail = await validateEmail(Model, email);
    switch (validatedEmail.tag) {
      case 'valid':
        user.email = validatedEmail.value;
        break;
      case 'invalid':
        return invalid({
          email: validatedEmail.value
        });
    }
  }
  // Profile.
  if (profile) {
    const validatedProfile = validateProfile(profile);
    switch (validatedProfile.tag) {
      case 'valid':
        if (validatedProfile.value.type !== user.profile.type) {
          return invalid({
            profile: ['You cannot change your user\'s profile type.']
          });
        }
        user.profile = validatedProfile.value;
        break;
      case 'invalid':
        return invalid({
          profile: validatedProfile.value
        });
    }
  }
  // Set updated date.
  user.updatedAt = now;
  return valid(user);
}

type RequiredModels = 'User' | 'Session';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, UpdateRequestBody, AppSession>;

const resource: Resource = {

  routeNamespace: 'users',

  create(Models) {
    const UserModel = Models.User as UserSchema.Model;
    const SessionModel = Models.Session as SessionSchema.Model;
    return {
      async transformRequest(request) {
        // TODO bad request response if body is not json
        const body = request.body.tag === 'json' ? request.body.value : {};
        const profile = isObject(body.profile) ? body.profile : {};
        const validatedUserType = validateUserType(getString(profile, 'type'));
        if (validatedUserType.tag === 'invalid' || !permissions.createUser(request.session, validatedUserType.value)) {
          return mapRequestBody(request, invalid({
            permissions: [permissions.ERROR_MESSAGE]
          }));
        }
        const email = getString(body, 'email');
        const password = getString(body, 'password');
        const acceptedTerms = getBoolean(body, 'acceptedTerms');
        const createdBy = get(request.session.user, 'id');
        const validatedBody = await validateCreateRequestBody(UserModel, email, password, acceptedTerms, profile, createdBy);
        return mapRequestBody(request, validatedBody);
      },
      async respond(request): Promise<Response<CreateResponseBody, AppSession>> {
        switch (request.body.tag) {
          case 'invalid':
            const invalidCode = request.body.value.permissions ? 401 : 400;
            return basicResponse(invalidCode, request.session, makeJsonResponseBody(request.body.value));
          case 'valid':
            const body = request.body.value;
            const user = new UserModel(body);
            await user.save();
            // Send notification email.
            try {
              await notifications.createUser(user.email);
            } catch (error) {
              request.logger.error('sending the createUser notification email failed', error);
            }
            // Sign in the user if they are creating their own account.
            // Otherwise, as is the case with Program Staff, leave them signed in.
            let session = request.session;
            if (!permissions.isSignedIn(request.session)) {
              session = await SessionSchema.signIn(SessionModel, UserModel, request.session, user._id);
            }
            return basicResponse(201, session, makeJsonResponseBody(UserSchema.makePublicUser(user)));
        }
      }
    };
  },

  readOne(Models) {
    const UserModel = Models.User as UserSchema.Model;
    return {
      transformRequest: identityAsync,
      async respond(request): Promise<Response<ReadOneResponseBody, AppSession>> {
        if (!permissions.readOneUser(request.session, request.params.id)) {
          return basicResponse(401, request.session, makeJsonResponseBody(null));
        }
        const user = await UserModel.findOne({ _id: request.params.id, active: true });
        if (!user) {
          return basicResponse(404, request.session, makeJsonResponseBody(null));
        } else {
          return basicResponse(200, request.session, makeJsonResponseBody(UserSchema.makePublicUser(user)));
        }
      }
    };
  },

  // TODO pagination.
  readMany(Models) {
    const UserModel = Models.User as UserSchema.Model;
    return {
      transformRequest: identityAsync,
      async respond(request): Promise<Response<ReadManyResponseBody, AppSession>> {
        if (!permissions.readManyUsers(request.session)) {
          return basicResponse(401, request.session, makeJsonResponseBody(null));
        }
        const users = await UserModel
          .find({ active: true })
          .sort({ email: 1 })
          .exec();
        return basicResponse(200, request.session, makeJsonResponseBody({
          total: users.length,
          offset: 0,
          count: users.length,
          items: users.map(user => UserSchema.makePublicUser(user))
        }));
      }
    };
  },

  update(Models) {
    const UserModel = Models.User as UserSchema.Model;
    return {
      async transformRequest(request) {
        const id = request.params.id;
        if (!permissions.updateUser(request.session, id)) {
          return mapRequestBody(request, invalid({
            permissions: [permissions.ERROR_MESSAGE]
          }));
        }
        // TODO bad request response if body is not json
        const body = request.body.tag === 'json' ? request.body.value : {};
        const email = getString(body, 'email') || undefined;
        const profile = isObject(body.profile) ? body.profile : undefined;
        const acceptedTerms = isBoolean(body.acceptedTerms) ? body.acceptedTerms : undefined;
        const newPassword = getString(body, 'newPassword') || undefined;
        const currentPassword = getString(body, 'currentPassword') || undefined;
        const validatedBody = await validateUpdateRequestBody(UserModel, id, email, profile, acceptedTerms, newPassword, currentPassword);
        return mapRequestBody(request, validatedBody);
      },
      async respond(request): Promise<Response<UpdateResponseBody, AppSession>> {
        switch (request.body.tag) {
          case 'invalid':
            const invalidCode = request.body.value.permissions ? 401 : 400;
            return basicResponse(invalidCode, request.session, makeJsonResponseBody(request.body.value));
          case 'valid':
            const user = request.body.value;
            await user.save();
            return basicResponse(200, request.session, makeJsonResponseBody(UserSchema.makePublicUser(user)));
        }
      }
    };
  },

  delete(Models) {
    const UserModel = Models.User as UserSchema.Model;
    const SessionModel = Models.Session as SessionSchema.Model;
    return {
      transformRequest: identityAsync,
      async respond(request): Promise<Response<DeleteResponseBody, AppSession>> {
        const user = await UserModel.findOne({ _id: request.params.id, active: true });
        if (!user) {
          return basicResponse(404, request.session, makeJsonResponseBody(null));
        }
        if (!permissions.deleteUser(request.session, user._id.toString(), user.profile.type)) {
          return basicResponse(401, request.session, makeJsonResponseBody(null));
        }
        user.deactivatedBy = get(request.session.user, 'id');
        user.active = false;
        await user.save();
        // Send notification email.
        try {
          await notifications.deleteUser(user.email);
        } catch (error) {
          request.logger.error('sending the deleteUser notification email failed', error);
        }
        let session = request.session;
        // Sign out the user if they are deactivating their own account.
        // Otherwise, as is the case with Program Staff, leave them signed in.
        if (permissions.isOwnAccount(request.session, user._id.toString())) {
          session = await SessionSchema.signOut(SessionModel, request.session);
        }
        return basicResponse(200, session, makeJsonResponseBody(null));
      }
    };
  }
};

export default resource;
