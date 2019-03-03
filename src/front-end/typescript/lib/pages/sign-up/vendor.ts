import * as VendorProfile from 'front-end/lib/components/profiles/vendor-profile';
import * as SignUp from 'front-end/lib/pages/sign-up/components/sign-up';

export const component = SignUp.component(VendorProfile.component);

export type Params = SignUp.Params;

export type Msg = SignUp.Msg<VendorProfile.InnerMsg>;

export type State = SignUp.State<VendorProfile.State>;

export const init = component.init;

export const update = component.update;

export const view = component.view;
