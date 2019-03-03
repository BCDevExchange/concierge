import { Dispatch, View } from 'front-end/lib/framework';
import * as FormField from 'front-end/lib/views/form-field';
import { default as React, FormEventHandler, SyntheticEvent } from 'react';

export interface Option {
  value: string;
  label: string;
}

export interface State extends FormField.State {
  options: Option[];
  unselectedLabel?: string;
}

interface ExtraProps {
  disabled: boolean;
}

export interface Props extends Pick<FormField.Props<State, HTMLSelectElement, undefined>, 'toggleHelp'> {
  state: State;
  disabled?: boolean;
  onChange: FormEventHandler<HTMLSelectElement>;
}

type ChildProps = FormField.ChildProps<State, HTMLSelectElement, ExtraProps>;

type InitParams = Pick<State, 'id' | 'value' | 'required' | 'label' | 'help' | 'options' | 'unselectedLabel'>;

export function init(params: InitParams): State {
  let options = params.options;
  if (params.unselectedLabel) {
    options = [{ value: '', label: params.unselectedLabel }].concat(params.options);
  }
  return {
    id: params.id,
    value: params.value,
    errors: [],
    required: params.required,
    label: params.label,
    options,
    unselectedLabel: params.unselectedLabel
  };
}

export function makeOnChange<Msg>(dispatch: Dispatch<Msg>, fn: (event: SyntheticEvent<HTMLSelectElement>) => Msg): FormEventHandler<HTMLSelectElement> {
  return event => {
    dispatch(fn(event));
  };
}

const Child: View<ChildProps> = props => {
  const { state, onChange, className, extraProps } = props;
  const disabled: boolean = !!(extraProps && extraProps.disabled) || false;
  const children = state.options.map((o, i) => {
    return (<option key={`select-option-${o.value}-${i}`} value={o.value}>{o.label}</option>);
  });
  return (
    <select
      name={state.id}
      id={state.id}
      value={state.value}
      disabled={disabled}
      className={className}
      onChange={onChange}>
      {children}
    </select>
  );
};

export const view: View<Props> = ({ state, onChange, toggleHelp, disabled }) => {
  const extraProps: ExtraProps = {
    disabled: disabled || false
  };
  return (
    <FormField.view Child={Child} state={state} onChange={onChange} toggleHelp={toggleHelp} extraProps={extraProps}/>
  );
};
