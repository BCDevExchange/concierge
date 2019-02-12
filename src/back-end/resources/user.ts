import * as crud from '../lib/crud';
import * as UserSchema from '../schemas/user';

export interface CreateRequestBody {
  name: string;
  age: number;
}

export interface UpdateRequestBody {
  name?: string;
  age?: number;
}

export type Resource = crud.Resource<UserSchema.Document, CreateRequestBody, UpdateRequestBody>;

function stubUser(Model: UserSchema.Model): UserSchema.Document {
  return new Model({
    name: 'Stub User',
    age: 22
  });
};

const resource: Resource = {

  ROUTE_NAMESPACE: 'users',
  MODEL_NAME: UserSchema.NAME,

  create: {

    transformRequestBody(body) {
      return {
        name: String(body.name) || 'Undefined Name',
        age: parseInt(body.age, 10) || 21
      };
    },

    async handler(Model, request) {
      return {
        code: 201,
        headers: {},
        body: stubUser(Model)
      };
    }

  },

  async readOne(Model, request) {
    return {
      code: 200,
      headers: {},
      body: stubUser(Model)
    };
  }

};

export default resource;
