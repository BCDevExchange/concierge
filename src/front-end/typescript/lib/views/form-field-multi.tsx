import { Immutable, View } from 'front-end/lib/framework';
import { cloneDeep, reduce } from 'lodash';
import { default as React, FormEventHandler } from 'react';
import { Alert, Button, FormGroup, FormText, InputGroup, InputGroupAddon, Label } from 'reactstrap';

export interface Field {
  value: string;
  errors: string[];
}

export function emptyField(): Field {
  return {
    value: '',
    errors: []
  };
}

export interface State {
  idNamespace: string;
  label?: string;
  labelClassName?: string;
  fields: Field[];
  help?: {
    text: string;
    show: boolean;
  }
}

export function getFieldValues(state: State): string[] {
  return state.fields.map(field => field.value);
}

export function setFieldValues(state: Immutable<State>, values: string[]): Immutable<State> {
  const fields = cloneDeep(state.fields);
  values.forEach((value, i) => fields[i].value = value);
  return state.set('fields', fields);
}

export function setFieldErrors(state: Immutable<State>, errors: string[][]): Immutable<State> {
  const fields = cloneDeep(state.fields);
  fields.forEach((field, i) => field.errors = errors[i] || []);
  return state.set('fields', fields);
}

export function isValid(state: Immutable<State>): boolean {
  return reduce(state.fields, (acc: boolean, v: Field) => {
    return acc && (!v.errors || !v.errors.length);
  }, true);
}

export interface ChildProps<ChildElement> {
  id: string;
  className: string;
  state: Field;
  onChange: FormEventHandler<ChildElement>;
}

export interface Props<ChildElement> {
  state: State;
  Child: View<ChildProps<ChildElement>>;
  onChange(index: number): FormEventHandler<ChildElement>;
  onAdd(): void;
  onRemove(index: number): void;
  toggleHelp?(): void;
}

const ConditionHelpToggle: View<Props<any>> = ({ state, toggleHelp }) => {
  const { help } = state;
  if (help && toggleHelp) {
    return (
      <a onClick={() => toggleHelp()}>
        {help.show ? 'Hide' : 'Show'} Help Text
      </a>
    );
  } else {
    return null;
  }
};

const ConditionalLabel: View<Props<any>> = (props) => {
  const { label } = props.state;
  if (label) {
    return (
      <Label>
        {label}
        <ConditionHelpToggle {...props} />
      </Label>
    );
  } else {
    return null;
  }
};

const ConditionalHelp: View<State> = ({ help }) => {
  if (help && help.show) {
    return (
      <Alert color='info'>
        {help.text}
      </Alert>
    );
  } else {
    return null;
  }
}

const ConditionalFieldErrors: View<Field> = ({ errors }) => {
  if (errors.length) {
    const errorElements = errors.map((error, i) => {
      return (<div key={i}>{error}</div>);
    });
    return (
      <FormText color='danger'>
        {errorElements}
      </FormText>
    );
  } else {
    return null;
  }
}

function Children<ChildElement>({ Child, state, onChange, onRemove }: Props<ChildElement>) {
  const children = state.fields.map((field, i) => {
    const id = `${state.idNamespace}-${i}`;
    const invalid = !!field.errors.length;
    const className = `form-control ${invalid ? 'is-invalid' : ''}`;
    return (
      <FormGroup key={i}>
        <InputGroup>
          <Child id={id} className={className} state={field} onChange={onChange(i)} />
          <InputGroupAddon addonType='append'>
            <Button color='danger' onClick={() => onRemove(i)}>
              Remove
            </Button>
          </InputGroupAddon>
        </InputGroup>
        <ConditionalFieldErrors {...field} />
      </FormGroup>
    );
  });
  return (
    <div>{children}</div>
  );
};

export function view<ChildElement>(props: Props<ChildElement>) {
  const { state, onAdd } = props;
  const labelClassName = state.labelClassName || '';
  return (
    <FormGroup className={`form-field-${state.idNamespace}`}>
      <div className={`d-flex justify-content-between align-items-center ${labelClassName}`}>
        <ConditionalLabel {...props} />
        <Button color='secondary' size='sm' className='ml-2' onClick={() => onAdd()}>
          Add
        </Button>
      </div>
      <ConditionalHelp {...state} />
      <Children {...props} />
    </FormGroup >
  );
}
