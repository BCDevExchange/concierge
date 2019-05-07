import { AvailableModels, SupportedRequestBodies } from 'back-end/lib/app';
import * as crud from 'back-end/lib/crud';
import * as permissions from 'back-end/lib/permissions';
import * as FileSchema from 'back-end/lib/schemas/file';
import * as RfiSchema from 'back-end/lib/schemas/request-for-information';
import { AppSession } from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import { basicResponse, JsonResponseBody, makeErrorResponseBody, makeJsonResponseBody, Response } from 'back-end/lib/server';
import { validateFileIdArray, validateUserId } from 'back-end/lib/validators';
import { get, isObject } from 'lodash';
import { getString, getStringArray } from 'shared/lib';
import { CreateValidationErrors, DELETE_ADDENDUM_TOKEN, PublicRfi, UpdateValidationErrors } from 'shared/lib/resources/request-for-information';
import { ADT, PaginatedList, UserType } from 'shared/lib/types';
import { allValid, getInvalidValue, getValidValue, invalid, valid, validateBoolean, validateCategories, ValidOrInvalid } from 'shared/lib/validators';
import { validateAddendumDescriptions, validateClosingDate, validateClosingTime, validateDescription, validatePublicSectorEntity, validateRfiNumber, validateTitle } from 'shared/lib/validators/request-for-information';

type CreateRequestBody
  = ADT<201, PublicRfi>
  | ADT<401, CreateValidationErrors>
  | ADT<400, CreateValidationErrors>;

async function validateCreateRequestBody(RfiModel: RfiSchema.Model, UserModel: UserSchema.Model, FileModel: FileSchema.Model, raw: object, session: AppSession): Promise<ValidOrInvalid<RfiSchema.Version, CreateValidationErrors>> {
  // Get raw values.
  const createdBy = getString(session.user, 'id');
  const closingDate = getString(raw, 'closingDate');
  const closingTime = getString(raw, 'closingTime');
  const rfiNumber = getString(raw, 'rfiNumber');
  const title = getString(raw, 'title');
  const description = getString(raw, 'description');
  const publicSectorEntity = getString(raw, 'publicSectorEntity');
  const categories = getStringArray(raw, 'categories');
  const discoveryDay = get(raw, 'discoveryDay');
  const addenda = getStringArray(raw, 'addenda');
  const attachments = getStringArray(raw, 'attachments');
  const buyerContact = getString(raw, 'buyerContact');
  const programStaffContact = getString(raw, 'programStaffContact');
  // Validate individual values.
  const validatedCreatedBy = await validateUserId(UserModel, createdBy, UserType.ProgramStaff);
  const validatedClosingDate = validateClosingDate(closingDate);
  const validatedClosingTime = validateClosingTime(closingTime, getValidValue(validatedClosingDate, ''));
  const validatedRfiNumber = validateRfiNumber(rfiNumber);
  const validatedTitle = validateTitle(title);
  const validatedDescription = validateDescription(description);
  const validatedPublicSectorEntity = validatePublicSectorEntity(publicSectorEntity);
  const validatedNumCategories = !categories.length ? invalid(['Please select at least one Commodity Code.']) : valid(null);
  const validatedCategories = validateCategories(categories, 'Commodity Code');
  const validatedDiscoveryDay = validateBoolean(discoveryDay);
  const validatedAddenda = validateAddendumDescriptions(addenda);
  const validatedAttachments = await validateFileIdArray(FileModel, attachments);
  const validatedBuyerContact = await validateUserId(UserModel, buyerContact, UserType.Buyer, true);
  const validatedProgramStaffContact = await validateUserId(UserModel, programStaffContact, UserType.ProgramStaff);
  // Check if the payload is valid.
  if (allValid([validatedCreatedBy, validatedClosingDate, validatedClosingTime, validatedRfiNumber, validatedTitle, validatedDescription, validatedPublicSectorEntity, validatedNumCategories, validatedCategories, validatedDiscoveryDay, validatedAddenda, validatedAttachments, validatedBuyerContact, validatedProgramStaffContact])) {
    // If everything is valid, return the version.
    const createdAt = new Date();
    const version: RfiSchema.Version = {
      createdAt,
      createdBy: (validatedCreatedBy.value as InstanceType<UserSchema.Model>)._id,
      closingAt: new Date(`${validatedClosingDate.value} ${validatedClosingTime.value}`),
      rfiNumber: validatedRfiNumber.value as string,
      title: validatedTitle.value as string,
      description: validatedDescription.value as string,
      publicSectorEntity: validatedPublicSectorEntity.value as string,
      categories: validatedCategories.value as string[],
      discoveryDay: validatedDiscoveryDay.value as boolean,
      addenda: (validatedAddenda.value as string[]).map((description: string) => {
        return {
          createdAt,
          updatedAt: createdAt,
          description
        };
      }),
      attachments: (validatedAttachments.value as Array<InstanceType<FileSchema.Model>>).map(file => file._id),
      buyerContact: (validatedBuyerContact.value as InstanceType<UserSchema.Model>)._id,
      programStaffContact: (validatedProgramStaffContact.value as InstanceType<UserSchema.Model>)._id
    };
    return valid(version);
  } else {
    // If anything is invalid, return the validation errors.
    return invalid({
      permissions: validatedCreatedBy.tag === 'invalid' ? [permissions.ERROR_MESSAGE] : undefined,
      closingDate: getInvalidValue(validatedClosingDate, undefined),
      closingTime: getInvalidValue(validatedClosingTime, undefined),
      rfiNumber: getInvalidValue(validatedRfiNumber, undefined),
      title: getInvalidValue(validatedTitle, undefined),
      description: getInvalidValue(validatedDescription, undefined),
      publicSectorEntity: getInvalidValue(validatedPublicSectorEntity, undefined),
      numCategories: getInvalidValue(validatedNumCategories, undefined),
      categories: getInvalidValue(validatedCategories, undefined),
      discoveryDay: getInvalidValue(validatedDiscoveryDay, undefined),
      addenda: getInvalidValue(validatedAddenda, undefined),
      attachments: getInvalidValue(validatedAttachments, undefined),
      buyerContact: getInvalidValue(validatedBuyerContact, undefined),
      programStaffContact: getInvalidValue(validatedProgramStaffContact, undefined)
    });
  }
}

type CreateResponseBody = JsonResponseBody<PublicRfi | CreateValidationErrors>;

type ReadOneResponseBody = JsonResponseBody<PublicRfi | string[]>;

type ReadManyResponseBody = JsonResponseBody<PaginatedList<PublicRfi> | string[]>;

type UpdateRequestBody
  = ADT<200, PublicRfi>
  | ADT<401, UpdateValidationErrors>
  | ADT<404, UpdateValidationErrors>
  | ADT<400, UpdateValidationErrors>;

type UpdateResponseBody = JsonResponseBody<PublicRfi | UpdateValidationErrors>;

export type Resource<RequiredModels extends keyof AvailableModels> = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, UpdateRequestBody, AppSession>;

type GetRfiModel<RfiModelName extends keyof AvailableModels> = (Models: Pick<AvailableModels, RfiModelName>) => RfiSchema.Model;

type GlobalPermissions = (session: AppSession) => boolean;

export function makeResource<RfiModelName extends keyof AvailableModels>(routeNamespace: string, getRfiModel: GetRfiModel<RfiModelName>, globalPermissions: GlobalPermissions): Resource<RfiModelName | 'User' | 'File'> {

  return {

    routeNamespace,

    create(Models) {
      const RfiModel = getRfiModel(Models);
      const FileModel = Models.File;
      const UserModel = Models.User;
      return {
        async transformRequest(request) {
          if (!globalPermissions(request.session) || !permissions.createRfi(request.session)) {
            return {
              tag: 401 as 401,
              value: {
                permissions: [permissions.ERROR_MESSAGE]
              }
            };
          }
          if (request.body.tag !== 'json') {
            return {
              tag: 400 as 400,
              value: {
                contentType: ['Requests for Information must be created with a JSON request.']
              }
            };
          }
          const rawBody = isObject(request.body.value) ? request.body.value : {};
          const validatedVersion = await validateCreateRequestBody(RfiModel, UserModel, FileModel, rawBody, request.session);
          switch (validatedVersion.tag) {
            case 'valid':
              const version = validatedVersion.value;
              // Remove addenda matching the DELETE_ADDENDUM_TOKEN
              version.addenda = version.addenda.filter(addendum => {
                return addendum.description !== DELETE_ADDENDUM_TOKEN;
              });
              const rfi = new RfiModel({
                createdAt: version.createdAt,
                // TODO publishedAt will need to change when we add drafts.
                publishedAt: version.createdAt,
                versions: [version],
                discoveryDayResponses: []
              });
              await rfi.save();
              return {
                tag: 201 as 201,
                value: await RfiSchema.makePublicRfi(UserModel, FileModel, rfi, request.session)
              };
            case 'invalid':
              return {
                tag: 400 as 400,
                value: validatedVersion.value
              };
          }
        },
        async respond(request): Promise<Response<CreateResponseBody, AppSession>> {
          return basicResponse(request.body.tag, request.session, makeJsonResponseBody(request.body.value));
        }
      };
    },

    readOne(Models) {
      const RfiModel = getRfiModel(Models);
      const FileModel = Models.File;
      const UserModel = Models.User;
      return {
        async transformRequest({ body }) {
          return body;
        },
        async respond(request): Promise<Response<ReadOneResponseBody, AppSession>> {
          if (!globalPermissions(request.session) || !permissions.readOneRfi()) {
            return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
          } else {
            let rfi: InstanceType<RfiSchema.Model> | null = null;
            try {
              rfi = await RfiModel.findById(request.params.id);
            } catch (error) {
              request.logger.error('unable to find RFI', makeErrorResponseBody(error).value);
            }
            if (!rfi || (!permissions.isProgramStaff(request.session) && !RfiSchema.hasBeenPublished(rfi))) {
              return basicResponse(404, request.session, makeJsonResponseBody(['RFI not found']));
            } else {
              const publicRfi = await RfiSchema.makePublicRfi(UserModel, FileModel, rfi, request.session);
              return basicResponse(200, request.session, makeJsonResponseBody(publicRfi));
            }
          }
        }
      };
    },

    // TODO pagination.
    readMany(Models) {
      const RfiModel = getRfiModel(Models);
      const FileModel = Models.File;
      const UserModel = Models.User;
      return {
        async transformRequest({ body }) {
          return body;
        },
        async respond(request): Promise<Response<ReadManyResponseBody, AppSession>> {
          if (!globalPermissions(request.session) || !permissions.readManyRfis()) {
            return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
          } else {
            let rfis = await RfiModel.find().exec();
            if (!permissions.isProgramStaff(request.session)) {
              rfis = rfis.filter(rfi => {
                return RfiSchema.hasBeenPublished(rfi);
              });
            }
            const publicRfis = await Promise.all(rfis.map(rfi => RfiSchema.makePublicRfi(UserModel, FileModel, rfi, request.session)));
            return basicResponse(200, request.session, makeJsonResponseBody({
              total: publicRfis.length,
              offset: 0,
              count: publicRfis.length,
              items: publicRfis
            }));
          }
        }
      };
    },

    update(Models) {
      const RfiModel = getRfiModel(Models);
      const FileModel = Models.File;
      const UserModel = Models.User;
      return {
        async transformRequest(request) {
          if (!globalPermissions(request.session) || !permissions.updateRfi(request.session)) {
            return {
              tag: 401 as 401,
              value: {
                permissions: [permissions.ERROR_MESSAGE]
              }
            };
          }
          if (request.body.tag !== 'json') {
            return {
              tag: 400 as 400,
              value: {
                contentType: ['Requests for Information must be updated with a JSON request.']
              }
            };
          }
          const rfi = await RfiModel.findById(request.params.id);
          if (!rfi) {
            return {
              tag: 404 as 404,
              value: {
                rfiId: ['RFI not found']
              }
            };
          }
          const rawBody = isObject(request.body.value) ? request.body.value : {};
          const validatedVersion = await validateCreateRequestBody(RfiModel, UserModel, FileModel, rawBody, request.session);
          switch (validatedVersion.tag) {
            case 'valid':
              const currentVersion: RfiSchema.Version | null = rfi.versions.reduce((acc: RfiSchema.Version | null, version) => {
                if (!acc || version.createdAt.getTime() > acc.createdAt.getTime()) {
                  return version;
                } else {
                  return acc;
                }
              }, null);
              const newVersion = validatedVersion.value;
              // Update the addenda correctly (support deleting, updating and adding new addenda).
              const now = new Date();
              const newAddenda = newVersion.addenda.map((newAddendum, index) => {
                const currentAddendum = get(currentVersion, ['addenda', index]);
                if (currentAddendum && newAddendum.description !== currentAddendum.description) {
                  // Addendum has changed.
                  return {
                    createdAt: currentAddendum.createdAt,
                    updatedAt: now,
                    description: newAddendum.description
                  };
                } else if (currentAddendum && newAddendum.description === currentAddendum.description) {
                  // The addendum has not changed, so we return the current addendum,
                  // which has the correct `updatedAt` date.
                  return currentAddendum;
                } else {
                  // Return the addendum if it is new, unchanged or flagged for deletion.
                  // Re: flagged for deletion, we will remove it later in this function.
                  return newAddendum;
                }
              });
              newVersion.addenda = newAddenda.filter(addendum => {
                return addendum.description !== DELETE_ADDENDUM_TOKEN;
              });
              // Persist the new version.
              rfi.versions.push(newVersion);
              await rfi.save();
              return {
                tag: 200 as 200,
                value: await RfiSchema.makePublicRfi(UserModel, FileModel, rfi, request.session)
              };
            case 'invalid':
              return {
                tag: 400 as 400,
                value: validatedVersion.value
              };
          }
        },
        async respond(request): Promise<Response<UpdateResponseBody, AppSession>> {
          return basicResponse(request.body.tag, request.session, makeJsonResponseBody(request.body.value));
        }
      };
    }
  };

}

export const resource = makeResource('requestsForInformation', Models => Models.Rfi, () => true);

export default resource;
