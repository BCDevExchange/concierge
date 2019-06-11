import { getString, getStringArray } from 'shared/lib';
import { BusinessType, parseBusinessType, UserType, VendorProfile } from 'shared/lib/types';
import { allValid, getInvalidValue, getValidValue, invalid, optional, valid, validateBusinessName, validateCategories, validateCity, validateContactName, validateCountry, validateEmail, validateGenericString, validateIndustrySectors, validatePhoneCountryCode, validatePhoneNumber, validatePhoneType, validatePositionTitle, validatePostalCode, validateProvince, validateStreetAddress, Validation, ValidOrInvalid } from './';

export interface VendorProfileValidationErrors {
  businessName?: string[];
  businessType?: string[];
  businessNumber?: string[];
  businessStreetAddress?: string[];
  businessCity?: string[];
  businessProvince?: string[];
  businessPostalCode?: string[];
  businessCountry?: string[];
  contactName?: string[];
  contactPositionTitle?: string[];
  contactEmail?: string[];
  contactPhoneNumber?: string[];
  contactPhoneCountryCode?: string[];
  contactPhoneType?: string[];
  numIndustrySectors?: string[];
  industrySectors?: string[][];
  numCategories?: string[];
  categories?: string[][];
}

export function validateBusinessType(userType: string): Validation<BusinessType> {
  const parsedBusinessType = parseBusinessType(userType);
  if (!parsedBusinessType) {
    return invalid([ 'Please select a valid Business Type; either "buyer", "vendor" or "program_staff".' ]);
  } else {
    return valid(parsedBusinessType);
  }
}

function validateBusinessNumber(businessNumber: string): Validation<string> {
  return validateGenericString(businessNumber, 'Business Number', 1, 20);
}

export function validateVendorProfile(profile: object): ValidOrInvalid<VendorProfile, VendorProfileValidationErrors> {
  const validatedBusinessName = validateBusinessName(getString(profile, 'businessName'));
  const validatedBusinessType = optional(validateBusinessType, getString(profile, 'businessType'));
  const validatedBusinessNumber = optional(validateBusinessNumber, getString(profile, 'businessNumber'));
  const validatedBusinessStreetAddress = optional(validateStreetAddress, getString(profile, 'businessStreetAddress'));
  const validatedBusinessCity = optional(validateCity, getString(profile, 'businessCity'));
  const validatedBusinessProvince = optional(validateProvince, getString(profile, 'businessProvince'));
  const validatedBusinessPostalCode = optional(validatePostalCode, getString(profile, 'businessPostalCode'));
  const validatedBusinessCountry = optional(validateCountry, getString(profile, 'businessCountry'));
  const validatedContactName = optional(validateContactName, getString(profile, 'contactName'));
  const validatedContactPositionTitle = optional(validatePositionTitle, getString(profile, 'contactPositionTitle'));
  const validatedContactEmail = optional(validateEmail, getString(profile, 'contactEmail'));
  const validatedContactPhoneNumber = optional(validatePhoneNumber, getString(profile, 'contactPhoneNumber'));
  const validatedContactPhoneCountryCode = optional(validatePhoneCountryCode, getString(profile, 'contactPhoneCountryCode'));
  const validatedContactPhoneType = optional(validatePhoneType, getString(profile, 'contactPhoneType'));
  const rawIndustrySectors = getStringArray(profile, 'industrySectors');
  const validatedNumIndustrySectors = !rawIndustrySectors.length ? invalid(['Please select at least one Industry Sector.']) : valid(null);
  const validatedIndustrySectors = validateIndustrySectors(rawIndustrySectors);
  const rawCategories = getStringArray(profile, 'categories');
  const validatedNumCategories = !rawCategories.length ? invalid(['Please select at least one Area of Interest.']) : valid(null);
  const validatedCategories = validateCategories(rawCategories, 'Area of Interest');
  if (allValid([validatedBusinessName, validatedBusinessType, validatedBusinessNumber, validatedBusinessStreetAddress, validatedBusinessCity, validatedBusinessProvince, validatedBusinessPostalCode, validatedBusinessCountry, validatedContactName, validatedContactPositionTitle, validatedContactEmail, validatedContactPhoneNumber, validatedContactPhoneCountryCode, validatedContactPhoneType, validatedNumIndustrySectors, validatedIndustrySectors, validatedNumCategories, validatedCategories])) {
    return valid({
      type: UserType.Vendor as UserType.Vendor,
      businessName: validatedBusinessName.value as string,
      businessType: getValidValue(validatedBusinessType, undefined),
      businessNumber: getValidValue(validatedBusinessNumber, undefined),
      businessStreetAddress: getValidValue(validatedBusinessStreetAddress, undefined),
      businessCity: getValidValue(validatedBusinessCity, undefined),
      businessProvince: getValidValue(validatedBusinessProvince, undefined),
      businessPostalCode: getValidValue(validatedBusinessPostalCode, undefined),
      businessCountry: getValidValue(validatedBusinessCountry, undefined),
      contactName: getValidValue(validatedContactName, undefined),
      contactPositionTitle: getValidValue(validatedContactPositionTitle, undefined),
      contactEmail: getValidValue(validatedContactEmail, undefined),
      contactPhoneNumber: getValidValue(validatedContactPhoneNumber, undefined),
      contactPhoneCountryCode: getValidValue(validatedContactPhoneCountryCode, undefined),
      contactPhoneType: getValidValue(validatedContactPhoneType, undefined),
      industrySectors: getValidValue(validatedIndustrySectors, []),
      categories: getValidValue(validatedCategories, [])
    });
  } else {
    return invalid({
      businessName: getInvalidValue(validatedBusinessName, [] as string[]),
      businessType: getInvalidValue(validatedBusinessType, [] as string[]),
      businessNumber: getInvalidValue(validatedBusinessNumber, [] as string[]),
      businessStreetAddress: getInvalidValue(validatedBusinessStreetAddress, [] as string[]),
      businessCity: getInvalidValue(validatedBusinessCity, [] as string[]),
      businessProvince: getInvalidValue(validatedBusinessProvince, [] as string[]),
      businessPostalCode: getInvalidValue(validatedBusinessPostalCode, [] as string[]),
      businessCountry: getInvalidValue(validatedBusinessCountry, [] as string[]),
      contactName: getInvalidValue(validatedContactName, [] as string[]),
      contactPositionTitle: getInvalidValue(validatedContactPositionTitle, [] as string[]),
      contactEmail: getInvalidValue(validatedContactEmail, [] as string[]),
      contactPhoneNumber: getInvalidValue(validatedContactPhoneNumber, [] as string[]),
      contactPhoneCountryCode: getInvalidValue(validatedContactPhoneCountryCode, [] as string[]),
      contactPhoneType: getInvalidValue(validatedContactPhoneType, [] as string[]),
      numIndustrySectors: getInvalidValue(validatedNumIndustrySectors, undefined),
      industrySectors: getInvalidValue(validatedIndustrySectors, [] as string[][]),
      numCategories: getInvalidValue(validatedNumCategories, undefined),
      categories: getInvalidValue(validatedCategories, [] as string[][])
    });
  }
}

export default validateVendorProfile;
