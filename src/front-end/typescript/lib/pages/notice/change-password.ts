import { Init } from 'front-end/lib/framework';
import * as Notice from 'front-end/lib/pages/notice/components/notice';

export type Params = null;

export type Msg = Notice.Msg;

export type State = Notice.State;

export const init: Init<Params, State> = async () => {
  return {
    title: 'Password Changed',
    body: 'Your password has been successfully changed.'
  };
};

export const update = Notice.update;

export const view = Notice.view;

export const component = {
  init,
  update: Notice.update,
  view: Notice.view
};
