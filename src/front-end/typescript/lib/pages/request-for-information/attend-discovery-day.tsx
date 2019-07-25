import { makePageMetadata, makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { isUserType } from 'front-end/lib/access-control';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, Dispatch, emptyPageAlerts, GlobalComponentMsg, Immutable, immutable, mapComponentDispatch, newRoute, PageComponent, PageInit, replaceRoute, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as Attendees from 'front-end/lib/pages/request-for-information/components/attendees';
import DiscoveryDayInfo from 'front-end/lib/pages/request-for-information/views/discovery-day-info';
import { WarningId } from 'front-end/lib/pages/terms-and-conditions';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import React from 'react';
import { Col, Row } from 'reactstrap';
import * as DdrResource from 'shared/lib/resources/discovery-day-response';
import { PublicDiscoveryDay, PublicRfi } from 'shared/lib/resources/request-for-information';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, UserType } from 'shared/lib/types';
import { invalid, valid, ValidOrInvalid } from 'shared/lib/validators';

export interface RouteParams {
  rfiId: string;
}

export type InnerMsg
  = ADT<'attendees', Attendees.Msg>
  | ADT<'startEditing'>
  | ADT<'cancelEditing'>
  | ADT<'cancelRegistration'>
  | ADT<'hideCancelRegistrationPrompt'>
  | ADT<'hideSubmitCreatePrompt'>
  | ADT<'hideSubmitEditPrompt'>
  | ADT<'hideCancelEditingPrompt'>
  | ADT<'submitCreate'>
  | ADT<'submitEdit'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

interface ValidState {
  isEditing: boolean;
  submitLoading: number;
  cancelRegistrationLoading: number;
  promptCancelRegistration: boolean;
  promptSubmitCreate: boolean;
  promptSubmitEdit: boolean;
  promptCancelEditing: boolean;
  rfi: PublicRfi;
  discoveryDay: PublicDiscoveryDay;
  vendor: PublicUser;
  // `ddr` cannot be an optional (i.e. undefined) field
  // because it doesn't work well with ImmutableJS records.
  // Since Immutable's records cannot "remove" a value (they
  // are set to the original value when set to undefined),
  // we need to use null here to workaround that problem since
  // null is recognised as a "new" value as opposed to unsetting
  // the current one.
  //
  // I discovered this problem when attempting to cancel a
  // registration after a hard reload. The UI would jump
  // the user into "edit" mode even though they had just
  // cancelled their registration successfully.
  ddr: DdrResource.PublicDiscoveryDayResponse | null;
  attendees: Immutable<Attendees.State>;
};

type InvalidState = null;

export type State = ValidOrInvalid<Immutable<ValidState>, InvalidState>;

async function resetAttendees(discoveryDay: PublicDiscoveryDay, vendor: PublicUser, ddr: DdrResource.PublicDiscoveryDayResponse | null): Promise<Immutable<Attendees.State>> {
  return immutable(await Attendees.init({
    occurringAt: discoveryDay.occurringAt,
    groups: [{
      attendees: ddr
        ? ddr.attendees
        : [{
            name: vendor.profile.type === UserType.Vendor
              ? vendor.profile.contactName
              : '',
            email: vendor.email,
            remote: false
          }]
    }]
  }));
}

async function resetState(state: Immutable<State>, ddr: DdrResource.PublicDiscoveryDayResponse | null): Promise<Immutable<State>> {
  if (state.tag === 'invalid') { return state; }
  return state
    .setIn(['value', 'isEditing'], !ddr)
    .setIn(['value', 'ddr'], ddr)
    .setIn(['value', 'attendees'], await resetAttendees(state.value.discoveryDay, state.value.vendor, ddr));
}

const init: PageInit<RouteParams, SharedState, State, Msg> = isUserType({

  userTypes: [UserType.Vendor],

  async success({ routeParams, shared, dispatch }) {
    const { rfiId } = routeParams;
    const { sessionUser } = shared;
    const notFoundRoute: Route = {
      tag: 'notice',
      value: {
        noticeId: { tag: 'notFound', value: undefined }
      }
    };
    const termsAndConditionsRoute: Route = {
      tag: 'termsAndConditions' as const,
      value: {
        warningId: WarningId.DiscoveryDayResponse,
        redirectOnAccept: router.routeToUrl({
          tag: 'requestForInformationAttendDiscoveryDay' as const,
          value: { rfiId }
        }),
        redirectOnSkip: router.routeToUrl({
          tag: 'requestForInformationView' as const,
          value: { rfiId }
        })
      }
    };
    const fail = (route: Route) => {
      dispatch(replaceRoute(route));
      return invalid(null);
    };
    const userResult = await api.readOneUser(sessionUser.id);
    if (userResult.tag === 'invalid' || !userResult.value.acceptedTermsAt) {
      return fail(termsAndConditionsRoute);
    }
    const rfiResult = await api.readOneRfi(rfiId);
    if (rfiResult.tag === 'invalid') { return fail(notFoundRoute); }
    const rfi = rfiResult.value;
    if (!rfi.latestVersion.discoveryDay) { return fail(notFoundRoute); }
    const discoveryDay = rfi.latestVersion.discoveryDay;
    const ddrResult = await api.readOneDdr(sessionUser.id, rfi._id);
    const ddr = ddrResult.tag === 'valid' ? ddrResult.value : null;
    return valid(immutable({
      isEditing: !ddr,
      submitLoading: 0,
      cancelRegistrationLoading: 0,
      promptCancelRegistration: false,
      promptSubmitCreate: false,
      promptSubmitEdit: false,
      promptCancelEditing: false,
      vendor: userResult.value,
      rfi,
      discoveryDay,
      ddr,
      attendees: await resetAttendees(discoveryDay, userResult.value, ddr)
    }));
  },

  async fail({ routeParams, dispatch, shared }) {
    if (shared.session && shared.session.user) {
      dispatch(newRoute({
        tag: 'requestForInformationView',
        value: {
          rfiId: routeParams.rfiId
        }
      }));
    } else {
      dispatch(newRoute({
        tag: 'signIn',
        value: {
          redirectOnSuccess: router.routeToUrl({
            tag: 'requestForInformationAttendDiscoveryDay',
            value: routeParams
          })
        }
      }));
    }
    return invalid(null);
  }

});

const startSubmitLoading: UpdateState<ValidState> = makeStartLoading('submitLoading');
const stopSubmitLoading: UpdateState<ValidState> = makeStopLoading('submitLoading');
const startCancelRegistrationLoading: UpdateState<ValidState> = makeStartLoading('cancelRegistrationLoading');
const stopCancelRegistrationLoading: UpdateState<ValidState> = makeStopLoading('cancelRegistrationLoading');

const update: Update<State, Msg> = ({ state, msg }) => {
  if (state.tag === 'invalid') { return [state]; }
  switch (msg.tag) {

    case 'attendees':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'attendees', value }),
        childStatePath: ['value', 'attendees'],
        childUpdate: Attendees.update,
        childMsg: msg.value
      });

    case 'startEditing':
      return [state.setIn(['value', 'isEditing'], true)];

    case 'cancelEditing':
    if (!state.value.promptCancelEditing) {
      return [state.setIn(['value', 'promptCancelEditing'], true)];
    } else {
      state = state.setIn(['value', 'promptCancelEditing'], false);
    }
    return [
      state.setIn(['value', 'isEditing'], false),
      async state => {
        if (state.tag === 'invalid') { return state; }
        return await resetState(state, state.value.ddr);
      }
    ];

    case 'hideCancelRegistrationPrompt':
      return [
        state.setIn(['value', 'promptCancelRegistration'], false)
      ];

    case 'hideSubmitCreatePrompt':
      return [
        state.setIn(['value', 'promptSubmitCreate'], false)
      ];

    case 'hideSubmitEditPrompt':
      return [
        state.setIn(['value', 'promptSubmitEdit'], false)
      ];

    case 'hideCancelEditingPrompt':
      return [
        state.setIn(['value', 'promptCancelEditing'], false)
      ];

    case 'cancelRegistration':
      if (!state.value.promptCancelRegistration) {
        return [state.setIn(['value', 'promptCancelRegistration'], true)];
      } else {
        state = state.setIn(['value', 'promptCancelRegistration'], false);
      }
      return [
        state.set('value', startCancelRegistrationLoading(state.value)),
        async state => {
          if (state.tag === 'invalid') { return state; }
          state = state.set('value', stopCancelRegistrationLoading(state.value));
          const result = await api.deleteDdr(state.value.vendor._id, state.value.rfi._id);
          switch (result.tag) {
            case 'valid':
              return await resetState(state, null);
            case 'invalid':
              return state;
          }
        }
      ];

    case 'submitCreate':
      if (!state.value.promptSubmitCreate) {
        return [state.setIn(['value', 'promptSubmitCreate'], true)];
      } else {
        state = state.setIn(['value', 'promptSubmitCreate'], false);
      }
      return [
        state.set('value', startSubmitLoading(state.value)),
        async (state, dispatch) => {
          if (state.tag === 'invalid') { return state; }
          const result = await api.createDdr({
            rfiId: state.value.rfi._id,
            vendorId: state.value.vendor._id,
            attendees: state.value.attendees.groups[0].attendees
          });
          switch (result.tag) {
            case 'valid':
              dispatch(newRoute({
                tag: 'notice',
                value: {
                  noticeId: {
                    tag: 'ddrSubmitted',
                    value: state.value.rfi._id
                  }
                }
              }));
              return state;
            case 'invalid':
              state = state.set('value', stopSubmitLoading(state.value));
              return state
                .setIn(['value', 'attendees'], Attendees.setErrors(state.value.attendees, [result.value.attendees || []]));
          }
        }
      ];

    case 'submitEdit':
      if (!state.value.promptSubmitEdit) {
        return [state.setIn(['value', 'promptSubmitEdit'], true)];
      } else {
        state = state.setIn(['value', 'promptSubmitEdit'], false);
      }
      return [
        state.set('value', startSubmitLoading(state.value)),
        async state => {
          if (state.tag === 'invalid') { return state; }
          state = state.set('value', stopSubmitLoading(state.value));
          const result = await api.updateDdr(state.value.vendor._id, state.value.rfi._id, state.value.attendees.groups[0].attendees);
          switch (result.tag) {
            case 'valid':
              return await resetState(state, result.value);
            case 'invalid':
            return state
              .setIn(['value', 'attendees'], Attendees.setErrors(state.value.attendees, [result.value.attendees || []]));
          }
        }
      ];

    default:
      return [state];
  }
};

const viewBottomBar: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.tag === 'invalid') { return null; }
  const { rfi, ddr, isEditing, submitLoading, cancelRegistrationLoading } = state.value;
  const isSubmitLoading = submitLoading > 0;
  const isCancelRegistrationLoading = cancelRegistrationLoading > 0;
  const isLoading = isSubmitLoading || isCancelRegistrationLoading;
  const isDisabled = isLoading || !Attendees.isValid(state.value.attendees);
  const submitCreate = () => !isDisabled && dispatch({ tag: 'submitCreate', value: undefined });
  const submitEdit = () => !isDisabled && dispatch({ tag: 'submitEdit', value: undefined });
  const startEditing = () => dispatch({ tag: 'startEditing', value: undefined });
  const cancelEditing = () => dispatch({ tag: 'cancelEditing', value: undefined });
  const cancelRegistration = () => dispatch({ tag: 'cancelRegistration', value: undefined });
  if (!ddr) {
    return (
      <FixedBar>
        <LoadingButton color='primary' onClick={submitCreate} loading={isSubmitLoading} disabled={isDisabled} className='text-nowrap'>
          Submit Registration
        </LoadingButton>
        <Link route={{ tag: 'requestForInformationView', value: { rfiId: rfi._id }}} color='secondary' className='text-nowrap mx-3'>
          Cancel
        </Link>
      </FixedBar>
    );
  } else {
    if (isEditing) {
      return (
        <FixedBar>
          <LoadingButton color='primary' onClick={submitEdit} loading={isSubmitLoading} disabled={isDisabled} className='text-nowrap'>
            Submit Changes
          </LoadingButton>
          <Link onClick={cancelEditing} color='secondary' className='text-nowrap mx-3'>
            Cancel
          </Link>
        </FixedBar>
      );
    } else {
      return (
        <FixedBar>
          <Link button color='primary' onClick={startEditing} disabled={isLoading} className='text-nowrap'>
            Edit Registration
          </Link>
          <LoadingButton color='danger' onClick={cancelRegistration} loading={isCancelRegistrationLoading} disabled={isLoading} className='text-nowrap mx-3'>
            Cancel Registration
          </LoadingButton>
          <Link route={{ tag: 'requestForInformationView', value: { rfiId: rfi._id }}} color='secondary' className='text-nowrap'>
            Cancel
          </Link>
        </FixedBar>
      );
    }
  }
};

const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  if (state.tag === 'invalid') { return null; }
  const { attendees, rfi, isEditing } = state.value;
  const version = rfi.latestVersion;
  const dispatchAttendees: Dispatch<Attendees.Msg> = mapComponentDispatch(dispatch, value => ({ tag: 'attendees' as const, value }));
  return (
    <div>
      <Row className='mb-5'>
        <Col xs='12' className='d-flex flex-column'>
          <h1>Discovery Day Registration</h1>
          <h3>{version.rfiNumber}: {version.title}</h3>
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <h2>Session Information</h2>
        </Col>
      </Row>
      <DiscoveryDayInfo discoveryDay={state.value.discoveryDay} />
      <Row className='mt-5 pb-3'>
        <Col xs='12' className='d-flex flex-column'>
          <h2>Attendee(s)</h2>
          <p>
            Please complete the following form to register one of more of your company's representatives to attend this RFI's Discovery Day session. If you are not personally attending, please clear your name and email from the list of attendees, and add the information of your colleagues that will be.
          </p>
          <p className='mt-2'>
            In-person and/or remote attendance information will be emailed to all attendees individually based on the information you provide. You can return to this page to update your team's attendance if required. Please note that you will not be able to add any in-person attendees less than 24 hours before the Discovery Day's scheduled time.
          </p>
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <Attendees.view state={attendees} dispatch={dispatchAttendees} disabled={!isEditing} />
        </Col>
      </Row>
    </div>
  );
};

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  viewBottomBar,
  getAlerts: emptyPageAlerts,
  getMetadata(state) {
    const title = `Attend Discovery Day${state.tag === 'valid' ? ' — ' + state.value.rfi.latestVersion.rfiNumber : ''}`;
    return makePageMetadata(title);
  },
  getBreadcrumbs(state) {
    if (state.tag === 'invalid') { return []; }
    return [
      {
        text: 'RFIs',
        onClickMsg: newRoute({
          tag: 'requestForInformationList',
          value: null
        })
      },
      {
        text: state.value.rfi.latestVersion.rfiNumber,
        onClickMsg: newRoute({
          tag: 'requestForInformationView',
          value: {
            rfiId: state.value.rfi._id
          }
        })
      },
      {
        text: 'Attend Discovery Day'
      }
    ];
  },
  getModal(state) {
    if (state.tag === 'invalid') { return null; }
    if (state.value.promptCancelRegistration) {
      return {
        title: 'Cancel Discovery Day Registration?',
        body: 'All attendees will be notified of the cancellation by email.',
        onCloseMsg: { tag: 'hideCancelRegistrationPrompt', value: undefined },
        actions: [
          {
            text: 'Yes, cancel registration',
            color: 'primary',
            button: true,
            msg: { tag: 'cancelRegistration', value: undefined }
          },
          {
            text: 'Go Back',
            color: 'secondary',
            msg: { tag: 'hideCancelRegistrationPrompt', value: undefined }
          }
        ]
      };
    } else if (state.value.promptSubmitCreate) {
      return {
        title: 'Submit Registration?',
        body: 'Please ensure all of the information you have provided is correct. Note that you may make changes to your registration after it has been submitted.',
        onCloseMsg: { tag: 'hideSubmitCreatePrompt', value: undefined },
        actions: [
          {
            text: 'Submit Registration',
            color: 'primary',
            button: true,
            msg: { tag: 'submitCreate', value: undefined }
          },
          {
            text: 'Go Back',
            color: 'secondary',
            msg: { tag: 'hideSubmitCreatePrompt', value: undefined }
          }
        ]
      }
    } else if (state.value.promptSubmitEdit) {
      return {
        title: 'Submit Changes to Registration?',
        body: 'Please ensure all of the information you have provided is correct. Attendees will be notified of any changes to their attendance by email. Any new attendees will be sent a confirmation email explaining how to attend the Discovery Day either in-person or remotely.',
        onCloseMsg: { tag: 'hideSubmitEditPrompt', value: undefined },
        actions: [
          {
            text: 'Submit Changes',
            color: 'primary',
            button: true,
            msg: { tag: 'submitEdit', value: undefined }
          },
          {
            text: 'Go Back',
            color: 'secondary',
            msg: { tag: 'hideSubmitEditPrompt', value: undefined }
          }
        ]
      }
    } else if (state.value.promptCancelEditing) {
      return {
        title: 'Cancel editing?',
        body: 'Any changes that you have made will be lost if you choose to cancel.',
        onCloseMsg: { tag: 'hideCancelEditingPrompt', value: undefined },
        actions: [
          {
            text: 'Yes, I want to cancel',
            color: 'primary',
            button: true,
            msg: { tag: 'cancelEditing', value: undefined }
          },
          {
            text: 'Go Back',
            color: 'secondary',
            msg: { tag: 'hideCancelEditingPrompt', value: undefined }
          }
        ]
      }
    } else {
      return null;
    }
  }
};
