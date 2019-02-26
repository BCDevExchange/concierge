import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Init, Update } from 'front-end/lib/framework';
import { validateConfirmPassword } from 'front-end/lib/validators';
import { validateAndUpdateField } from 'front-end/lib/views/form-field';
import * as ShortText from 'front-end/lib/views/input/short-text';
import { default as React } from 'react';
import { Col, Form, FormGroup, Label, Row } from 'reactstrap';
import { ADT } from 'shared/lib/types';
import { validateEmail, validatePassword } from 'shared/lib/validators';

export interface ValidationErrors {
  email?: string[];
  password?: string[];
  confirmPassword?: string[];
}

export interface State {
  validationErrors: ValidationErrors;
  email: ShortText.State;
  password: ShortText.State;
  confirmPassword: ShortText.State;
}

type InnerMsg
  = ADT<'onChangeEmail', string>
  | ADT<'onChangePassword', string>
  | ADT<'onChangeConfirmPassword', string>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export const init: Init<undefined, State> = async () => {
  return {
    validationErrors: {},
    email: ShortText.init({
      id: 'email',
      required: true,
      type: 'email',
      label: 'Email Address',
      placeholder: 'Email Address'
    }),
    password: ShortText.init({
      id: 'password',
      required: true,
      type: 'password',
      label: 'Password',
      placeholder: 'Password'
    }),
    confirmPassword: ShortText.init({
      id: 'confirmPassword',
      required: true,
      type: 'password',
      label: 'Confirm Password',
      placeholder: 'Confirm Password'
    })
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  const json = state.toJSON();
  switch (msg.tag) {
    case 'onChangeEmail':
      return [validateAndUpdateField(state, 'email', msg.value, validateEmail)];
    case 'onChangePassword':
      return [validateAndUpdateField(state, 'password', msg.value, validatePassword)];
    case 'onChangeConfirmPassword':
      return [validateAndUpdateField(state, 'confirmPassword', msg.value, v => validateConfirmPassword(json.password.value, v))];
    default:
      return [state];
  }
};

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChange = (tag: any) => ShortText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  return (
    <div>
      <Row>
        <Col xs='12'>
          <h3>Account Information</h3>
        </Col>
      </Row>
      <Form>
        <Row>
          <Col xs='12'>
            <FormGroup check inline>
              <Label>
                I am a*:
              </Label>
              <div className='custom-radio custom-control'>
                <input type='radio' name='foo' value='bar' className='form-check-input' checked />
                <Label>Buyer</Label>
              </div>
              <div className='custom-radio custom-control'>
                <input type='radio' name='foo' value='baz' className='form-check-input' />
                <Label>Vendor</Label>
              </div>
            </FormGroup>
          </Col>
          <Col xs='12'>
            <ShortText.view
              state={state.email}
              onChange={onChange('onChangeEmail')} />
          </Col>
          <Col xs='12'>
            <ShortText.view
              state={state.password}
              onChange={onChange('onChangePassword')} />
          </Col>
          <Col xs='12'>
            <ShortText.view
              state={state.confirmPassword}
              onChange={onChange('onChangeConfirmPassword')} />
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export const component: Component<undefined, State, Msg> = {
  init,
  update,
  view
};
