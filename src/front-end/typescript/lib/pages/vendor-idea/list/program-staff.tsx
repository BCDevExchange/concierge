import { VI_APPLICATION_DOWNLOAD_URL, VI_APPLICATION_FILE_ALIAS } from 'front-end/config';
import { makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { Route } from 'front-end/lib/app/types';
import * as FileMulti from 'front-end/lib/components/form-field-multi/file';
import * as TableComponent from 'front-end/lib/components/table';
import { ComponentView, Dispatch, GlobalComponentMsg, Immutable, immutable, Init, mapComponentDispatch, newRoute, PageGetModal, Update, updateComponentChild, View } from 'front-end/lib/framework';
import { createFile, hasUserAcceptedTerms, readManyVisForProgramStaff, readOneFile } from 'front-end/lib/http/api';
import { getLogItemTypeStatusDropdownItems } from 'front-end/lib/pages/vendor-idea/lib';
import { LogItemTypeBadge } from 'front-end/lib/pages/vendor-idea/views/log-item-type-badge';
import LogItemTypeSelectGroupLabel from 'front-end/lib/pages/vendor-idea/views/log-item-type-select-group-label';
import * as Select from 'front-end/lib/views/form-field/select';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import Icon from 'front-end/lib/views/icon';
import Link from 'front-end/lib/views/link';
import { default as React, ReactElement } from 'react';
import { Col, Row, Spinner } from 'reactstrap';
import { compareDates, formatDateAndTime, rawFormatDate } from 'shared/lib';
import { PublicFile } from 'shared/lib/resources/file';
import { PublicSessionUser } from 'shared/lib/resources/session';
import { PublicVendorIdeaSlimForProgramStaff } from 'shared/lib/resources/vendor-idea';
import { LogItemType, parseLogItemType } from 'shared/lib/resources/vendor-idea/log-item';
import { ADT, profileToName, UserType } from 'shared/lib/types';
import { getValidValue } from 'shared/lib/validators';

function formatTableDate(date: Date): string {
  return rawFormatDate(date, 'YYYY-MM-DD', false);
}

// Define Table component.

type TableCellData
  = ADT<'status', LogItemType>
  | ADT<'title', { title: string, vendorName: string, viId: string, dispatch: Dispatch<Msg> }>
  | ADT<'dateSubmitted', Date>
  | ADT<'lastUpdated', Date>;

const Table: TableComponent.TableComponent<TableCellData> = TableComponent.component();

const TDView: View<TableComponent.TDProps<TableCellData>> = ({ data }) => {
  const wrap = (child: string | null | ReactElement<any>, wrapText = false, center = false) => {
    return (<td className={`${wrapText ? 'text-wrap' : ''} ${center ? 'text-center' : ''} align-top`}>{child}</td>);
  };
  switch (data.tag) {
    case 'status':
      return wrap((<LogItemTypeBadge logItemType={data.value} />));
    case 'title':
      return wrap((
        <div>
          <Link onClick={() => data.value.dispatch({ tag: 'editVi', value: data.value.viId })} className='mb-1'>
            {data.value.title}
          </Link>
          <div className='small text-uppercase text-secondary pt-1' style={{ lineHeight: '1.25rem' }}>{data.value.vendorName}</div>
        </div>
      ), true);
    case 'dateSubmitted':
    case 'lastUpdated':
      return wrap(formatTableDate(data.value));
  }
}

interface VendorIdea extends PublicVendorIdeaSlimForProgramStaff {
  createdByName: string;
}

export interface State {
  uploadTemplateLoading: number;
  promptEditConfirmation?: string;
  promptUploadTemplateConfirmation?: File;
  templateFile?: PublicFile;
  vis: VendorIdea[];
  visibleVis: VendorIdea[];
  sessionUser: PublicSessionUser;
  statusFilter: Select.State;
  searchFilter: ShortText.State;
  table: Immutable<TableComponent.State<TableCellData>>;
};

type FormFieldKeys
  = 'statusFilter'
  | 'searchFilter';

export interface Params {
  sessionUser: PublicSessionUser;
}

type InnerMsg
  = ADT<'statusFilter', Select.Value>
  | ADT<'searchFilter', string>
  | ADT<'table', TableComponent.Msg>
  | ADT<'uploadTemplate', File>
  | ADT<'editVi', string>
  | ADT<'hideEditConfirmationPrompt'>
  | ADT<'hideUploadTemplateConfirmationPrompt'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export const init: Init<Params, State> = async ({ sessionUser }) => {
  const visResult = await readManyVisForProgramStaff();
  let vis: VendorIdea[] = [];
  if (visResult.tag === 'valid') {
    vis = visResult.value.items
      .map(vi => ({ ...vi, createdByName: profileToName(vi.createdBy.profile) }))
      // Sort vendor ideas by date submitted.
      .sort((a, b) => {
        return compareDates(a.createdAt, b.createdAt) * -1;
      });
  }
  const templateFileResult = await readOneFile(VI_APPLICATION_FILE_ALIAS);
  return {
    uploadTemplateLoading: 0,
    promptEditConfirmation: undefined,
    promptUploadTemplateConfirmation: undefined,
    sessionUser,
    templateFile: getValidValue(templateFileResult, undefined),
    vis,
    visibleVis: vis,
    statusFilter: Select.init({
      id: 'vi-list-filter-status',
      required: false,
      label: 'Status',
      placeholder: 'All',
      options: { tag: 'optionGroups', value: getLogItemTypeStatusDropdownItems() }
    }),
    searchFilter: ShortText.init({
      id: 'rfi-list-filter-search',
      type: 'text',
      required: false,
      placeholder: 'Search'
    }),
    table: immutable(await Table.init({
      idNamespace: 'rfi-list',
      THView: TableComponent.DefaultTHView,
      TDView
    }))
  };
};

function viMatchesStatus(vi: VendorIdea, filterStatus: LogItemType | null): boolean {
  if (!filterStatus) { return false; }
  return vi.latestStatus === filterStatus;
}

function viMatchesSearch(vi: VendorIdea, query: RegExp): boolean {
  return !!vi.latestVersion.description.title.match(query) || !!vi.createdByName.match(query);
}

function updateAndQuery<K extends FormFieldKeys>(state: Immutable<State>, key: K, value: State[K]['value']): Immutable<State> {
  // Update state with the filter value.
  state = state.setIn([key, 'value'], value);
  // Query the list of available RFIs based on all filters' state.
  const statusQuery = state.statusFilter.value && state.statusFilter.value.value;
  const rawSearchQuery = state.searchFilter.value;
  const searchQuery = rawSearchQuery ? new RegExp(state.searchFilter.value.split(/\s+/).join('.*'), 'i') : null;
  const vis = state.vis.filter(vi => {
    let match = true;
    match = match && (!statusQuery || viMatchesStatus(vi, parseLogItemType(statusQuery)));
    match = match && (!searchQuery || viMatchesSearch(vi, searchQuery));
    return match;
  });
  return state.set('visibleVis', vis); ;
}

const startUploadTemplateLoading: UpdateState<State> = makeStartLoading('uploadTemplateLoading');
const stopUploadTemplateLoading: UpdateState<State>  = makeStopLoading('uploadTemplateLoading');

export const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'statusFilter':
      return [updateAndQuery(state, 'statusFilter', msg.value)];
    case 'searchFilter':
      return [updateAndQuery(state, 'searchFilter', msg.value)];
    case 'table':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'table' as const, value }),
        childStatePath: ['table'],
        childUpdate: Table.update,
        childMsg: msg.value
      });
    case 'uploadTemplate':
      if (!state.promptUploadTemplateConfirmation) {
        return [state.set('promptUploadTemplateConfirmation', msg.value)];
      } else {
        state = state.set('promptUploadTemplateConfirmation', undefined);
      }
      return [
        startUploadTemplateLoading(state),
        async state => {
          state = stopUploadTemplateLoading(state);
          const result = await createFile({
            name: msg.value.name,
            file: msg.value,
            alias: VI_APPLICATION_FILE_ALIAS,
            authLevel: { tag: 'userType', value: [UserType.ProgramStaff, UserType.Vendor] }
          });
          switch (result.tag) {
            case 'valid':
              return state.set('templateFile', result.value);
            case 'invalid':
              return state;
          }
        }
      ];
    case 'editVi':
      return [
        state,
        async (state, dispatch) => {
          if (state.promptEditConfirmation || (await hasUserAcceptedTerms(state.sessionUser.id))) {
            dispatch(newRoute({
              tag: 'viEdit',
              value: { viId: msg.value }
            }));
            return null;
          } else {
            return state.set('promptEditConfirmation', msg.value);
          }
        }
      ];
    case 'hideEditConfirmationPrompt':
      return [state.set('promptEditConfirmation', undefined)];
    case 'hideUploadTemplateConfirmationPrompt':
      return [state.set('promptUploadTemplateConfirmation', undefined)];
    default:
      return [state];
  }
};

const Filters: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, value => ({ tag, value }));
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, value => ({ tag, value }));
  return (
    <div>
      <Row>
        <Col xs='12'>
          <h3 className='mb-3'>
            Submission(s)
          </h3>
        </Col>
      </Row>
      <Row className='d-none d-md-flex align-items-end'>
        <Col xs='12' md='5' lg='4'>
          <Select.view
            state={state.statusFilter}
            formatGroupLabel={LogItemTypeSelectGroupLabel}
            onChange={onChangeSelect('statusFilter')} />
        </Col>
        <Col xs='12' md='4' className='ml-md-auto'>
          <ShortText.view
            state={state.searchFilter}
            onChange={onChangeShortText('searchFilter')} />
        </Col>
      </Row>
    </div>
  );
};

const tableHeadCells: TableComponent.THSpec[] = [
  {
    children: 'Status',
    style: {
      width: '25%'
    }
  },
  {
    children: 'Title',
    style: {
      minWidth: '340px',
      width: '55%'
    }
  },
  {
    children: 'Date Submitted',
    style: {
      width: '10%'
    }
  },
  {
    children: 'Last Updated',
    style: {
      width: '10%'
    }
  }
];

function tableBodyRows(vis: VendorIdea[], dispatch: Dispatch<Msg>): Array<Array<TableComponent.TDSpec<TableCellData>>> {
  return vis.map(vi => {
    return [
      TableComponent.makeTDSpec({ tag: 'status' as const, value: vi.latestStatus }),
      TableComponent.makeTDSpec({
        tag: 'title' as const,
        value: {
          viId: vi._id,
          title: vi.latestVersion.description.title,
          vendorName: vi.createdByName,
          dispatch
        }
      }),
      TableComponent.makeTDSpec({ tag: 'dateSubmitted' as const, value: vi.createdAt }),
      TableComponent.makeTDSpec({ tag: 'lastUpdated' as const, value: vi.latestVersion.createdAt })
    ];
  });
}

const ConditionalTable: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (!state.vis.length) { return (<div>There are currently no Vendor Initiated-Ideas available.</div>); }
  if (!state.visibleVis.length) { return (<div>There are no Vendor-Initiated Ideas that match the search criteria.</div>); }
  const dispatchTable: Dispatch<TableComponent.Msg> = mapComponentDispatch(dispatch, value => ({ tag: 'table' as const, value }));
  return (
    <Table.view
      className='text-nowrap'
      style={{ lineHeight: '1.5rem' }}
      headCells={tableHeadCells}
      bodyRows={tableBodyRows(state.visibleVis, dispatch)}
      state={state.table}
      dispatch={dispatchTable} />
  );
}

export const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  const uploadTemplate = (value: File) => dispatch({ tag: 'uploadTemplate', value });
  const isUploadTemplateLoading = state.uploadTemplateLoading > 0;
  return (
    <div>
      <Row className='mb-5'>
        <Col xs='12' md='9' lg='8'>
          <h1>Vendor-Initiated Ideas</h1>
        </Col>
      </Row>
      <Row className='mb-5'>
        <Col xs='12' md='9' lg='8'>
          <div className='mb-3 d-flex flex-column flex-md-row align-items-start align-items-md-center'>
            <h3 className='mb-0 mr-md-3 mb-3 mb-md-0'>Application Template</h3>
            <div className='d-flex align-items-center flex-nowrap'>
              <FileMulti.AddButton onAdd={uploadTemplate} text='Upload New Template' />
              {isUploadTemplateLoading ? (<Spinner size='sm' color='muted' className='ml-3' />) : null}
            </div>
          </div>
          {state.templateFile
            ? (<div>
                <div className='d-flex align-items-start mb-3'>
                  <Icon name='paperclip' color='secondary' className='mr-2 mt-1 flex-shrink-0' width={1.1} height={1.1} />
                  <Link download href={VI_APPLICATION_DOWNLOAD_URL}>{state.templateFile.originalName}</Link>
                </div>
                <div className='text-secondary small'>Uploaded: {formatDateAndTime(state.templateFile.createdAt, true)}</div>
              </div>)
            : (<div>An application template has not yet been uploaded.</div>)}
        </Col>
      </Row>
      <Filters {...props} />
      <ConditionalTable {...props} />
    </div>
  );
};

export const getModal: PageGetModal<State, Msg> = state => {
  if (state.promptEditConfirmation) {
    return {
      title: 'Review Terms and Conditions',
      body: 'You must accept the Procurement Concierge Terms and Conditions in order to view or edit a Vendor-Initiated Idea.',
      onCloseMsg: { tag: 'hideEditConfirmationPrompt', value: undefined },
      actions: [
        {
          text: 'Review Terms & Conditions',
          color: 'primary',
          button: true,
          msg: { tag: 'editVi', value: state.promptEditConfirmation }
        },
        {
          text: 'Go Back',
          color: 'secondary',
          msg: { tag: 'hideEditConfirmationPrompt', value: undefined }
        }
      ]
    };
  } else if (state.promptUploadTemplateConfirmation) {
    return {
      title: 'Upload New Template?',
      body: 'The current version of the Vendor-Initiated Idea Application template will be removed, and cannot be recovered once it has been replaced.',
      onCloseMsg: { tag: 'hideUploadTemplateConfirmationPrompt', value: undefined },
      actions: [
        {
          text: 'Continue',
          color: 'primary',
          button: true,
          msg: { tag: 'uploadTemplate', value: state.promptUploadTemplateConfirmation }
        },
        {
          text: 'Go Back',
          color: 'secondary',
          msg: { tag: 'hideUploadTemplateConfirmationPrompt', value: undefined }
        }
      ]
    };
  } else {
    return null;
  }
};
