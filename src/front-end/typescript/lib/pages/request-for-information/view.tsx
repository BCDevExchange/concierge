import { makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Immutable, Init, newUrl, Update, View } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { publishedDateToString, updatedDateToString } from 'front-end/lib/pages/request-for-information/lib';
import StatusBadge from 'front-end/lib/pages/request-for-information/views/status-badge';
import * as FixedBar from 'front-end/lib/views/fixed-bar';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import Icon from 'front-end/lib/views/icon';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import Markdown from 'front-end/lib/views/markdown';
import { default as React, ReactElement } from 'react';
import { Alert, Col, Container, Row } from 'reactstrap';
import { compareDates, formatDate, formatTime } from 'shared/lib';
import * as DdrResource from 'shared/lib/resources/discovery-day-response';
import * as FileResource from 'shared/lib/resources/file';
import { makeFileBlobPath } from 'shared/lib/resources/file-blob';
import { PublicRfi, RFI_EXPIRY_WINDOW_DAYS, rfiToRfiStatus } from 'shared/lib/resources/request-for-information';
import { Addendum, ADT, RfiStatus, UserType } from 'shared/lib/types';

const ERROR_MESSAGE = 'The Request for Information you are looking for is not available.';
const CONTACT_EMAIL = 'Procurement.Concierge@gov.bc.ca';
const ATTACHMENTS_ID = 'attachments';

export interface Params {
  rfiId: string;
  userType?: UserType;
  fixedBarBottom?: number;
}

export type InnerMsg
  = ADT<'respondToDiscoveryDay'>
  | ADT<'updateFixedBarBottom', number>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export interface State {
  fixedBarBottom: number;
  respondToDiscoveryDayLoading: number;
  alerts: string[];
  userType?: UserType;
  rfi?: PublicRfi;
  ddr?: DdrResource.PublicDiscoveryDayResponse;
};

export const init: Init<Params, State> = async ({ rfiId, userType, fixedBarBottom = 0 }) => {
  const defaultState: State = {
    fixedBarBottom,
    respondToDiscoveryDayLoading: 0,
    alerts: [],
    userType
  };
  const rfiResult = await api.readOneRfi(rfiId);
  switch (rfiResult.tag) {
    case 'valid':
      const rfi = rfiResult.value;
      // Show newest addenda first.
      if (rfi.latestVersion) {
        rfi.latestVersion.addenda.reverse();
      }
      // Determine if the user has already sent a Discovery Day Response,
      // if they are a Vendor.
      let ddr: DdrResource.PublicDiscoveryDayResponse | undefined;
      if (userType === UserType.Vendor) {
        const ddrResult = await api.readOneDdr(rfi._id);
        if (ddrResult.tag === 'valid') {
          ddr = ddrResult.value;
        }
      }
      // Determine alerts to display on the page.
      const alerts: string[] = [];
      // Use `mightViewResponseButtons` to only show response-related alerts
      // to unauthenticated users and Vendor.
      const mightViewResponseButtons = userType === UserType.Vendor || !userType;
      const rfiStatus = rfiToRfiStatus(rfi);
      if (mightViewResponseButtons && rfiStatus === RfiStatus.Closed) {
        alerts.push(`This RFI is still accepting responses up to ${RFI_EXPIRY_WINDOW_DAYS} calendar days after the closing date and time.`);
      }
      if (mightViewResponseButtons && rfiStatus === RfiStatus.Expired) {
        alerts.push('This RFI is no longer accepting responses.');
      }
      const updatedAt = rfi.latestVersion && rfi.latestVersion.createdAt;
      if (rfiStatus === RfiStatus.Open && updatedAt && compareDates(rfi.publishedAt, updatedAt) === -1) {
        alerts.push(`This RFI was last updated on ${formatDate(updatedAt)}.`);
      }
      return {
        ...defaultState,
        alerts,
        rfi,
        ddr
      };
    case 'invalid':
      return defaultState;
  }
};

const startRespondToDiscoveryDayLoading: UpdateState<State> = makeStartLoading('respondToDiscoveryDayLoading');
const stopRespondToDiscoveryDayLoading: UpdateState<State> = makeStopLoading('respondToDiscoveryDayLoading');

export const update: Update<State, Msg> = (state, msg) => {
  if (!state.rfi) { return [state]; }
  switch (msg.tag) {
    case 'respondToDiscoveryDay':
      return [
        startRespondToDiscoveryDayLoading(state),
        async (state, dispatch) => {
          if (!state.rfi) { return state; }
          const finish = (state: Immutable<State>) => stopRespondToDiscoveryDayLoading(state);
          const thisPage: Page = {
            tag: 'requestForInformationView' as 'requestForInformationView',
            value: {
              rfiId: state.rfi._id
            }
          };
          // TODO once we refactor how page's do auth and get session information,
          // we should clean up this code.
          const session = await api.getSession();
          // Redirect the user to the sign-in form.
          if (session.tag === 'invalid' || !session.value.user) {
            dispatch(newUrl({
              tag: 'signIn' as 'signIn',
              value: {
                redirectOnSuccess: thisPage
              }
            }));
            return finish(state);
          }
          // Do nothing when the API fails to return the user data, as this shouldn't happen.
          // TODO figure out what to do for UX.
          const user = await api.readOneUser(session.value.user.id);
          if (user.tag === 'invalid') { return finish(state); }
          const acceptedTerms = !!user.value.acceptedTermsAt;
          // Ask the user to accept the terms first.
          if (!acceptedTerms) {
            dispatch(newUrl({
              tag: 'termsAndConditions' as 'termsAndConditions',
              value: {
                userId: user.value._id,
                warnings: ['You must accept the terms and conditions in order to register for a Discovery Session.'],
                redirectOnAccept: thisPage,
                redirectOnSkip: thisPage
              }
            }));
            return finish(state);
          }
          // Otherwise, process the response.
          const result = await api.createDdr({
            rfiId: state.rfi._id
          });
          switch (result.tag) {
            case 'valid':
              return finish(state.set('ddr', result.value));
            case 'invalid':
              // TODO show error messages from the server.
              // TODO Redirect to T&C if required.
              return finish(state);
          }
        }
      ];
    case 'updateFixedBarBottom':
      return [state.set('fixedBarBottom', msg.value)];
    default:
      return [state];
  }
};

interface DetailProps {
  title: string;
  values: Array<string | ReactElement<any>>;
}

const Detail: View<DetailProps> = ({ title, values }) => {
  values = values.map((v, i) => (<div key={`${title}-${i}`}>{v}</div>));
  return (
    <Row className='align-items-start mb-3'>
      <Col xs='12' md='5' className='font-weight-bold text-secondary text-center text-md-right'>{title}</Col>
      <Col xs='12' md='7' className='text-center text-md-left'>{values}</Col>
    </Row>
  );
};

const Details: View<{ rfi: PublicRfi }> = ({ rfi }) => {
  const version = rfi.latestVersion;
  if (!version) { return null; }
  const contactValues = [
    `${version.programStaffContact.firstName} ${version.programStaffContact.lastName}`,
    version.programStaffContact.positionTitle,
    (<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>)
  ];
  const statusValues = [
    (<StatusBadge rfi={rfi} style={{ fontSize: '0.85rem' }} />)
  ];
  const attachmentsValues = version.attachments.length
    ? [(<a href={`#${ATTACHMENTS_ID}`}>View Attachments</a>)]
    : ['No attachments'];
  return (
    <Row>
      <Col xs='12' md='7'>
        <Detail title='Commodity Code(s)' values={version.categories} />
        <Detail title='Public Sector Entity' values={[version.publicSectorEntity]} />
        <Detail title='Contact' values={contactValues} />
      </Col>
      <Col xs='12' md='5'>
        <Detail title='Status' values={statusValues} />
        <Detail title='Closing Date' values={[formatDate(version.closingAt)]} />
        <Detail title='Closing Time' values={[formatTime(version.closingAt, true)]} />
        <Detail title='Attachments' values={attachmentsValues} />
      </Col>
    </Row>
  );
}

const Description: View<{ value: string }> = ({ value }) => {
  return (
    <Row className='mt-5 pt-5 border-top'>
      <Col xs='12'>
        <Markdown source={value} />
      </Col>
    </Row>
  );
}

const Attachments: View<{ files: FileResource.PublicFile[] }> = ({ files }) => {
  if (!files.length) { return null; }
  const children = files.map((file, i) => {
    return (
      <div className='d-flex align-items-start mb-2' key={`view-rfi-attachment-${i}`}>
        <Icon name='paperclip' color='secondary' className='mr-2 mt-1 flex-shrink-0' width={1.1} height={1.1} />
        <a href={makeFileBlobPath(file._id)} className='d-block' download>
          {file.originalName}
        </a>
      </div>
    );
  });
  return (
    <div className='pt-5 mt-5 border-top' id={ATTACHMENTS_ID}>
      <FormSectionHeading text='Attachments' />
      <Row>
        <Col xs='12'>
          {children}
        </Col>
      </Row>
    </div>
  );
}

const Addenda: View<{ addenda: Addendum[] }> = ({ addenda }) => {
  if (!addenda.length) { return null; }
  const children = addenda.map((addendum, i) => {
    return (
      <div key={`view-rfi-addendum-${i}`} className={`pb-${i === addenda.length - 1 ? '0' : '4'} w-100`}>
        <Col xs='12' md={{ size: 10, offset: 1 }} className={i !== 0 ? 'pt-4 border-top' : ''}>
          <p className='mb-2'>{addendum.description}</p>
        </Col>
        <Col xs='12' md={{ size: 10, offset: 1 }} className='d-flex flex-column flex-md-row justify-content-between text-secondary'>
          <small>{publishedDateToString(addendum.createdAt)}</small>
          <small>{updatedDateToString(addendum.updatedAt)}</small>
        </Col>
      </div>
    );
  });
  return (
    <Row className='mt-5 pt-5 border-top'>
      <Col xs='12'>
        <h3 className='pb-3'>Addenda</h3>
      </Col>
      {children}
    </Row>
  );
}

interface RespondToDiscoveryDayButtonProps {
  loading: boolean;
  discoveryDay: boolean;
  alreadyResponded: boolean;
  onClick(): void;
}

const RespondToDiscoveryDayButton: View<RespondToDiscoveryDayButtonProps> = props => {
  const { loading, discoveryDay, alreadyResponded, onClick } = props;
  if (!discoveryDay) { return null; }
  const disabled = alreadyResponded || loading;
  const text = alreadyResponded ? 'Discovery Session Request Sent' : 'Attend Discovery Session';
  return (
    <LoadingButton color='info' onClick={onClick} loading={loading} disabled={disabled} className='ml-3 ml-md-0 mx-md-3 text-nowrap'>
      {text}
    </LoadingButton>
  );
};

function showButtons(rfiStatus: RfiStatus | null, userType?: UserType): boolean {
  return (!userType || userType === UserType.Vendor) && !!rfiStatus && rfiStatus !== RfiStatus.Expired;
}

const Buttons: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  // Only show these buttons for Vendors and unauthenticated users.
  if (!state.rfi || !state.rfi.latestVersion) { return null; }
  const rfiStatus = rfiToRfiStatus(state.rfi);
  if (!showButtons(rfiStatus, state.userType)) { return null; }
  const bottomBarIsFixed = state.fixedBarBottom === 0;
  const version = state.rfi.latestVersion;
  const alreadyRespondedToDiscoveryDay = !!state.ddr;
  const respondToDiscoveryDay = () => !alreadyRespondedToDiscoveryDay && dispatch({ tag: 'respondToDiscoveryDay', value: undefined });
  const isLoading = state.respondToDiscoveryDayLoading > 0;
  const respondToRfiPage: Page = {
    tag: 'requestForInformationRespond',
    value: {
      rfiId: state.rfi._id
    }
  };
  return (
    <FixedBar.View location={bottomBarIsFixed ? 'bottom' : undefined}>
      <Link page={respondToRfiPage} buttonColor='primary' disabled={isLoading} className='text-nowrap'>
        Respond to RFI
      </Link>
      {rfiStatus === RfiStatus.Open
        ? (<RespondToDiscoveryDayButton
             discoveryDay={version.discoveryDay}
             alreadyResponded={alreadyRespondedToDiscoveryDay}
             onClick={respondToDiscoveryDay}
             loading={isLoading} />)
        : null}
      <div className='text-secondary font-weight-bold d-none d-md-block mr-auto'>I want to...</div>
    </FixedBar.View>
  );
};

const ConditionalAlerts: View<Pick<State, 'alerts'>> = ({ alerts }) => {
  if (!alerts.length) { return null; }
  return (
    <Row>
      <Col xs='12'>
        <Alert color='primary' className='mb-5'>
          {alerts.map((text, i) => (<div key={`rfi-view-alert-${i}`}>{text}</div>))}
        </Alert>
      </Col>
    </Row>
  );
};

export const view: ComponentView<State, Msg> = props => {
  const { state } = props;
  if (!state.rfi || !state.rfi.latestVersion) {
    return (
      <PageContainer.View paddingY>
        <Row>
          <Col xs='12'>
            <Alert color='danger'>
              <div>
                {ERROR_MESSAGE}
              </div>
            </Alert>
          </Col>
        </Row>
      </PageContainer.View>
    );
  }
  const rfiStatus = rfiToRfiStatus(state.rfi);
  const buttonsAreVisible = showButtons(rfiStatus, state.userType);
  const bottomBarIsFixed = buttonsAreVisible && state.fixedBarBottom === 0;
  const paddingY = !buttonsAreVisible;
  const paddingTop = buttonsAreVisible;
  const rfi = state.rfi;
  const version = state.rfi.latestVersion;
  return (
    <PageContainer.View marginFixedBar={bottomBarIsFixed} paddingY={paddingY} paddingTop={paddingTop} fullWidth>
      <Container className='mb-5 flex-grow-1'>
        <ConditionalAlerts alerts={state.alerts} />
        <Row className='mb-5'>
          <Col xs='12' className='d-flex flex-column text-center align-items-center'>
            <h1 className='h4'>RFI Number: {version.rfiNumber}</h1>
            <h2 className='h1'>{version.title}</h2>
            <div className='text-secondary small'>
              {publishedDateToString(rfi.publishedAt)}
            </div>
            <div className='text-secondary small'>
              {updatedDateToString(version.createdAt)}
            </div>
          </Col>
        </Row>
        <Details rfi={rfi} />
        <Description value={version.description} />
        <Attachments files={version.attachments} />
        <Addenda addenda={version.addenda} />
      </Container>
      <Buttons {...props} />
    </PageContainer.View>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
