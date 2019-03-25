import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Init, Update, View } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { publishedDateToString, updatedDateToString } from 'front-end/lib/pages/request-for-information/lib';
import * as RfiStatus from 'front-end/lib/pages/request-for-information/views/status';
import * as FixedBar from 'front-end/lib/views/fixed-bar';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import Icon from 'front-end/lib/views/icon';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import Markdown from 'front-end/lib/views/markdown';
import { default as React, ReactElement } from 'react';
import { Alert, Col, Container, Row } from 'reactstrap';
import { formatDate, formatTime } from 'shared/lib';
import * as FileResource from 'shared/lib/resources/file';
import { makeFileBlobPath } from 'shared/lib/resources/file-blob';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import { Addendum, ADT, UserType } from 'shared/lib/types';

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
  | ADT<'respondToRfi'>
  | ADT<'updateFixedBarBottom', number>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export interface State {
  fixedBarBottom: number;
  respondToDiscoveryDayLoading: number;
  userType?: UserType;
  rfi?: RfiResource.PublicRfi;
};

export const init: Init<Params, State> = async ({ rfiId, userType, fixedBarBottom = 0 }) => {
  const result = await api.readOneRfi(rfiId);
  switch (result.tag) {
    case 'valid':
      return {
        fixedBarBottom,
        respondToDiscoveryDayLoading: 0,
        userType,
        rfi: result.value
      };
    case 'invalid':
      return {
        fixedBarBottom,
        respondToDiscoveryDayLoading: 0,
        userType
      };
  }
};

/*function startRespondToDiscoveryDayLoading(state: Immutable<State>): Immutable<State> {
  return state.set('respondToDiscoveryDayLoading', state.respondToDiscoveryDayLoading + 1);
}

function stopRespondToDiscoveryDayLoading(state: Immutable<State>): Immutable<State> {
  return state.set('respondToDiscoveryDayLoading', state.respondToDiscoveryDayLoading - 1);
}*/

export const update: Update<State, Msg> = (state, msg) => {
  if (!state.rfi) { return [state]; }
  switch (msg.tag) {
    case 'respondToDiscoveryDay':
      return [state];
    case 'respondToRfi':
      return [state];
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

const Details: View<{ rfi: RfiResource.PublicRfi }> = ({ rfi }) => {
  const version = rfi.latestVersion;
  if (!version) { return null; }
  const contactValues = [
    `${version.programStaffContact.firstName} ${version.programStaffContact.lastName}`,
    version.programStaffContact.positionTitle,
    (<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>)
  ];
  const statusValues = [
    (<RfiStatus.Badge status={RfiStatus.rfiToStatus(rfi)} style={{ fontSize: '0.85rem' }} />)
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
  discoveryDay: boolean
  onClick(): void;
}

const RespondToDiscoveryDayButton: View<RespondToDiscoveryDayButtonProps> = props => {
  const disabled = props.discoveryDay || props.loading;
  const text = props.discoveryDay ? 'Discovery Session Request Sent' : 'Attend Discovery Session';
  return (
    <LoadingButton color='secondary' onClick={props.onClick} loading={props.loading} disabled={disabled} className='ml-3 ml-md-0 mx-md-3 text-nowrap'>
      {text}
    </LoadingButton>
  );
};

function showButtons(userType?: UserType): boolean {
  return !userType || userType === UserType.Vendor;
}

const Buttons: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  // Only show these buttons for Vendors and unauthenticated users.
  if (!showButtons(state.userType) || !state.rfi || !state.rfi.latestVersion) { return null; }
  const bottomBarIsFixed = state.fixedBarBottom === 0;
  const version = state.rfi.latestVersion;
  const respondToDiscoveryDay = () => dispatch({ tag: 'respondToDiscoveryDay', value: undefined });
  const isLoading = state.respondToDiscoveryDayLoading > 0;
  return (
    <FixedBar.View location={bottomBarIsFixed ? 'bottom' : undefined}>
      <Link buttonColor={isLoading ? 'secondary' : 'primary'} disabled={isLoading} className='text-nowrap'>
        Respond to RFI
      </Link>
      <RespondToDiscoveryDayButton
        discoveryDay={version.discoveryDay}
        onClick={respondToDiscoveryDay}
        loading={isLoading} />
      <div className='text-secondary font-weight-bold d-none d-md-block mr-auto'>I want to...</div>
    </FixedBar.View>
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
  const buttonsAreVisible = showButtons(state.userType);
  const bottomBarIsFixed = buttonsAreVisible && state.fixedBarBottom === 0;
  const paddingY = !buttonsAreVisible;
  const paddingTop = buttonsAreVisible;
  const rfi = state.rfi;
  const version = state.rfi.latestVersion;
  return (
    <PageContainer.View marginFixedBar={bottomBarIsFixed} paddingY={paddingY} paddingTop={paddingTop} fullWidth>
      <Container className='mb-5 flex-grow-1'>
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
