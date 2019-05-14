import { Dispatch, View } from 'front-end/lib/framework';
import * as FormField from 'front-end/lib/views/form-field';
import * as Input from 'front-end/lib/views/input/input';
import { ChangeEvent, ChangeEventHandler, default as React, KeyboardEventHandler } from 'react';

export interface State extends FormField.State {
  type: 'text' | 'email' | 'password' | 'date';
  placeholder?: string;
}

type OnEnter = () => void;

interface ExtraProps {
  onKeyUp: KeyboardEventHandler<HTMLInputElement>;
  disabled: boolean;
  onChangeDebounced?: Input.OnChangeDebounced;
  inputClassName: string;
}

export interface Props extends Pick<FormField.Props<State, HTMLInputElement, ExtraProps>, 'toggleHelp'> {
  state: State;
  disabled?: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onChangeDebounced?: Input.OnChangeDebounced;
  onEnter?: OnEnter;
  inputClassName?: string;
}

interface Params extends Pick<State, 'id' | 'required' | 'type' | 'label' | 'placeholder' | 'help'> {
  value?: string;
}

export function init(params: Params): State {
  return {
    id: params.id,
    value: params.value || '',
    errors: [],
    required: params.required,
    type: params.type,
    label: params.label,
    placeholder: params.placeholder
  };
}

export function makeOnChange<Msg>(dispatch: Dispatch<Msg>, fn: (event: ChangeEvent<HTMLInputElement>) => Msg): ChangeEventHandler<HTMLInputElement> {
  return event => {
    dispatch(fn(event));
  };
}

function makeOnKeyUp(onEnter?: OnEnter): KeyboardEventHandler<HTMLInputElement> {
  return event => {
    if (event.key === 'Enter' && onEnter) { onEnter(); }
  };
};

const Child: View<FormField.ChildProps<State, HTMLInputElement, ExtraProps>> = props => {
  const { state, className, onChange, extraProps } = props;
  const inputClassName: string = (extraProps && extraProps.inputClassName) || '';
  const disabled: boolean = !!(extraProps && extraProps.disabled) || false;
  return (
    <Input.View
      id={state.id}
      type={state.type}
      value={state.value}
      placeholder={state.placeholder}
      className={`${className} ${inputClassName} form-control`}
      disabled={disabled}
      onChange={onChange}
      onChangeDebounced={extraProps && extraProps.onChangeDebounced}
      onKeyUp={extraProps && extraProps.onKeyUp} />
  );
};

export const view: View<Props> = ({ state, onChange, onChangeDebounced, onEnter, toggleHelp, disabled = false, inputClassName = '' }) => {
  const extraProps: ExtraProps = {
    onKeyUp: makeOnKeyUp(onEnter),
    onChangeDebounced,
    disabled,
    inputClassName
  };
  return (
    <FormField.view Child={Child} state={state} onChange={onChange} toggleHelp={toggleHelp} extraProps={extraProps} />
  );
};
