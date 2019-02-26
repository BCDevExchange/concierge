import * as crud from 'back-end/lib/crud';
import loggerHook from 'back-end/lib/hooks/logger';
import sessionResource from 'back-end/lib/resources/session';
import userResource from 'back-end/lib/resources/user';
import frontEndRouter from 'back-end/lib/routers/front-end';
import * as SessionSchema from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import { addHooksToRoute, FileResponseBody, JsonResponseBody, namespaceRoute, notFoundJsonRoute, Route, Router } from 'back-end/lib/server';
import { concat, flatten, flow, map } from 'lodash/fp';
import * as mongoose from 'mongoose';
import mongooseDefault from 'mongoose';
import { flipCurried } from 'shared/lib';

export type Session = SessionSchema.AppSession;

export async function connectToDatabase(mongoUrl: string): Promise<mongoose.Connection> {
  await mongooseDefault.connect(mongoUrl, {
    useNewUrlParser: true
  });
  return mongooseDefault.connection;
}

// Add new models as properties on this interface.
export interface AvailableModels {
  Session: SessionSchema.Model;
  User: UserSchema.Model;
}

export function createModels(): AvailableModels {
  // Add new models to this object.
  return {
    Session: mongoose.model(SessionSchema.NAME, SessionSchema.schema),
    User: mongoose.model(UserSchema.NAME, UserSchema.schema)
  };
};

type SupportedResponseBodies = JsonResponseBody | FileResponseBody;

export function createRouter(Models: AvailableModels): Router<SupportedResponseBodies, Session> {
  const hooks = [
    loggerHook
  ];

  // Add new resources to this array.
  const resources: Array<crud.Resource<AvailableModels, any, any, any, any, any, any, any, any, any, Session>> = [
    userResource,
    sessionResource
  ];

  // Define CRUD routes.
  // We need to use `flippedConcat` as using `concat` binds the routes in the wrong order.
  const flippedConcat = flipCurried(concat);
  const crudRoutes = flow([
    // Create routers from resources.
    map((resource: crud.Resource<AvailableModels, any, any, any, any, any, any, any, any, any, Session>) => {
      return crud.makeRouter(resource)(Models);
    }),
    // Make a flat list of routes.
    flatten,
    // Respond with a standard 404 JSON response if API route is not handled.
    flippedConcat(notFoundJsonRoute),
    // Namespace all CRUD routes with '/api'.
    map((route: Route<any, any, any, JsonResponseBody, any, Session>) => namespaceRoute('/api', route))
  ])(resources);

  // Return all routes.
  return flow([
    // API routes.
    flippedConcat(crudRoutes),
    // Front-end router.
    flippedConcat(frontEndRouter),
    // Add global hooks to all routes.
    map((route: Route<any, any, any, any, any, Session>) => addHooksToRoute(hooks, route))
  ])([]);
}