import React from 'react';
import { Component, ComponentView, Init, Update } from '../lib/framework';

export interface State {
  value: number;
}

export type Msg = number;

export const init: Init<null, State> = async () => {
  return {
    value: 123
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  return [state];
};

export const view: ComponentView<State, Msg> = () => {
  return (
    <div>Loading Two</div>
  );
};

export const component: Component<null, State, Msg> = {
  init,
  update,
  view
};
