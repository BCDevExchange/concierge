// TODO how to handle receiving files via multipart request?

import { DomainLogger } from 'back-end/lib/logger';
import { existsSync, readFileSync, statSync } from 'fs';
import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { assign } from 'lodash';
import { lookup } from 'mime-types';
import mongoose from 'mongoose';
import { ADT } from 'shared/lib/types';

export enum HttpMethod {
  Any = '*',
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Patch = 'PATCH',
  Delete = 'DELETE',
  Options = 'OPTIONS'
}

export function parseHttpMethod(raw: string): HttpMethod | null {
  switch (raw.toLowerCase()) {
    case 'get':
      return HttpMethod.Get;
    case 'post':
      return HttpMethod.Post;
    case 'put':
      return HttpMethod.Put;
    case 'patch':
      return HttpMethod.Patch;
    case 'delete':
      return HttpMethod.Delete;
    case 'options':
      return HttpMethod.Options;
    default:
      return null;
  }
}

export type SessionId = mongoose.Types.ObjectId;

export function parseSessionId(raw: any): SessionId {
  try {
    return new mongoose.Types.ObjectId(raw);
  } catch {
    return new mongoose.Types.ObjectId();
  }
}

export type SessionIdToSession<Session> = (sessionId: SessionId) => Promise<Session>;

export type SessionToSessionId<Session> = (session: Session) => SessionId;

export interface ConfigurableRequest<Params, Query, Body> {
  params: Params;
  query: Query;
  body: Body;
}

export function nullConfigurableRequest(): ConfigurableRequest<null, null, null> {
  return {
    params: null,
    query: null,
    body: null
  };
}

export interface Request<Params, Query, Body, Session> extends ConfigurableRequest<Params, Query, Body> {
  id: mongoose.Types.ObjectId;
  path: string,
  headers: IncomingHttpHeaders;
  logger: DomainLogger;
  method: HttpMethod;
  session: Session;
}

export interface Response<Body, Session> {
  code: number;
  headers: OutgoingHttpHeaders;
  session: Session;
  body: Body;
}

export type JsonResponseBody = ADT<'json', any>;

export function makeJsonResponseBody(value: any): JsonResponseBody {
  return {
    tag: 'json',
    value
  };
}

export function mapJsonResponse<Session>(response: Response<any, Session>): Response<JsonResponseBody, Session> {
  return {
    code: response.code,
    headers: response.headers,
    session: response.session,
    body: makeJsonResponseBody(response.body)
  };
}

export interface File {
  buffer: Buffer;
  contentType: string;
}

export type FileResponseBody = ADT<'file', File | null>;

// TODO do we need fallback handling here?
// TODO do something better than responding with a `null` file.
export function makeFileResponseBody(path: string, fallbackPath?: string): FileResponseBody {
  function nullFile(): FileResponseBody {
    return { tag: 'file', value: null };
  }
  try {
    function validFile(path: string): boolean {
      return existsSync(path) && statSync(path).isFile();
    }
    function unsafeRead(path: string): FileResponseBody {
      return {
        tag: 'file',
        value: {
          buffer: readFileSync(path),
          contentType: lookup(path) || 'application/octet-stream'
        }
      };
    }
    if (validFile(path)) {
      return unsafeRead(path);
    } else if (fallbackPath && validFile(fallbackPath)) {
      return unsafeRead(fallbackPath);
    } else {
      return nullFile();
    }
  } catch (e) {
    return nullFile();
  }
}

export function mapFileResponse<Session>(response: Response<string, Session>): Response<FileResponseBody, Session> {
  return {
    code: response.code,
    headers: response.headers,
    session: response.session,
    body: makeFileResponseBody(response.body)
  };
}

export type TextResponseBody = ADT<'text', string>;

export function makeTextResponseBody(value: string): TextResponseBody {
  return {
    tag: 'text',
    value
  };
}

export function mapTextResponse<Session>(response: Response<string, Session>): Response<TextResponseBody, Session> {
  return {
    code: response.code,
    headers: response.headers,
    session: response.session,
    body: makeTextResponseBody(response.body)
  };
}

export type ErrorResponseBody = ADT<'error', Error>;

export function makeErrorResponseBody(value: Error): ErrorResponseBody {
  return {
    tag: 'error',
    value
  };
}

export function mapErrorResponse<Session>(response: Response<Error, Session>): Response<ErrorResponseBody, Session> {
  return {
    code: response.code,
    headers: response.headers,
    session: response.session,
    body: makeErrorResponseBody(response.body)
  };
}

export type TransformRequest<RPA, RQA, RBA, RPB, RQB, RBB, Session> = (request: Request<RPA, RQA, RBA, Session>) => Promise<ConfigurableRequest<RPB, RQB, RBB>>;

export function composeTransformRequest<RPA, RQA, RBA, RPB, RQB, RBB, RPC, RQC, RBC, Session>(a: TransformRequest<RPA, RQA, RBA, RPB, RQB, RBB, Session>, b: TransformRequest<RPB, RQB, RBB, RPC, RQC, RBC, Session>): TransformRequest<RPA, RQA, RBA, RPC, RQC, RBC, Session> {
  return async request => {
    const newConfigurableRequestA = await a(request);
    const newConfigurableRequestB = await b({
      id: request.id,
      path: request.path,
      headers: request.headers,
      logger: request.logger,
      method: request.method,
      session: request.session,
      params: newConfigurableRequestA.params,
      query: newConfigurableRequestA.query,
      body: newConfigurableRequestA.body
    });
    return {
      id: request.id,
      path: request.path,
      headers: request.headers,
      logger: request.logger,
      method: request.method,
      session: request.session,
      params: newConfigurableRequestB.params,
      query: newConfigurableRequestB.query,
      body: newConfigurableRequestB.body
    };
  };
}

export type Respond<RP, RQ, ReqB, ResB, Session> = (request: Request<RP, RQ, ReqB, Session>) => Promise<Response<ResB, Session>>;

export function mapRespond<RP, RQ, ReqB, ResBA, ResBB, Session>(respond: Respond<RP, RQ, ReqB, ResBA, Session>, fn: (response: Response<ResBA, Session>) => Response<ResBB, Session>): Respond<RP, RQ, ReqB, ResBB, Session> {
  return async request => {
    const response = await respond(request);
    return fn(response);
  };
}

export interface Handler<RPA, RQA, ReqBA, RPB, RQB, ReqBB, ResB, Session> {
  transformRequest: TransformRequest<RPA, RQA, ReqBA, RPB, RQB, ReqBB, Session>;
  respond: Respond<RPB, RQB, ReqBB, ResB, Session>;
}

export const notFoundJsonHandler: Handler<any, any, any, any, any, any, JsonResponseBody, any> = {

  async transformRequest(request) {
    return request;
  },

  async respond(request) {
    return {
      code: 404,
      headers: {},
      session: request.session,
      body: makeJsonResponseBody({})
    };
  }

};

export interface RouteHook<RP, RQ, ReqB, ResB, State, Session> {
  before(request: Request<RP, RQ, ReqB, Session>): Promise<State>;
  after?(state: State, request: Request<RP, RQ, ReqB, Session>, response: Response<ResB, Session>): Promise<void>;
}

export function combineHooks<Session>(hooks: Array<RouteHook<any, any, any, any, any, Session>>): RouteHook<any, any, any, any, any, Session> {
  return {
    async before(request) {
      const results = [];
      for (const hook of hooks) {
        results.push({
          state: await hook.before(request),
          after: hook.after
        });
      }
      return results;
    },
    async after(state, request, response) {
      for (const hook of state) {
        if (hook.after) {
          hook.after(hook.state, request, response);
        }
      }
    }
  };
}

export interface Route<RP, RQ, ReqB, ResB, HS, Session> {
  method: HttpMethod;
  path: string;
  handler: Handler<object, object, any, RP, RQ, ReqB, ResB, Session>;
  hook?: RouteHook<RP, RQ, ReqB, ResB, HS, Session>;
}

export function namespaceRoute(prefix: string, route: Route<any, any, any, any, any, any>) {
  const path = `${prefix.replace(/\/*$/, '')}/${route.path.replace(/^\/*/, '')}`;
  return assign(route, { path });
}

export function addHooksToRoute<Session>(hooks: Array<RouteHook<any, any, any, any, any, Session>>, route: Route<any, any, any, any, any, Session>): Route<any, any, any, any, any, Session> {
  const newHook = combineHooks(hooks);
  route.hook = route.hook ? combineHooks([newHook, route.hook]) : newHook;
  return route;
}

export const notFoundJsonRoute: Route<any, any, any, JsonResponseBody, any, any> = {
  method: HttpMethod.Any,
  path: '*',
  handler: notFoundJsonHandler
}

export type Router<ResB, Session> = Array<Route<any, any, any, ResB, any, Session>>;

export type AuthenticationState<Value, Session> = ADT<'authenticated', { session: Session, body: Value }> | ADT<'unauthenticated', { body: Value }>;

export function authenticated<Value, Session>(body: Value, session: Session): AuthenticationState<Value, Session> {
  return {
    tag: 'authenticated',
    value: {
      session,
      body
    }
  };
}

export function unauthenticated<Value, Session>(body: Value): AuthenticationState<Value, Session> {
  return {
    tag: 'unauthenticated',
    value: { body }
  };
}
