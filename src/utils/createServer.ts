import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { ApolloServer } from "apollo-server-fastify";
import { buildSchema } from "type-graphql";
import { UserResolver } from "../modules/user/user.resolver";
import fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { ApolloServerPlugin } from "apollo-server-plugin-base";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { GraphQLSchema, execute, subscribe } from "graphql";
import { User } from "../modules/user/user.dto";
import { bearerAuthChecker } from "./bearerAuthChecker";

const app = fastify({
  logger: true,
});

// fastify plugins

const origins = ["http://localhost:4000"];

app.register(fastifyCors, {
  credentials: true,
  origin: (origin, cb) => {
    if (!origin || origins.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error("not alowed"), false);
  },
});

app.register(fastifyCookie, {
  secret: "change-me",
});

app.register(fastifyJwt, {
  secret: "change-me",
  cookie: {
    cookieName: "token",
    signed: false,
  },
});

function fastifyAppClosePlugin(app: FastifyInstance): ApolloServerPlugin {
  return {
    async serverWillStart() {
      return {
        async drainServer() {
          app.close();
        },
      };
    },
  };
}

export type CtxUser = Omit<User, "password">;

async function buildContext({
  connectionParams,
  request,
  reply,
}: {
  connectionParams?: {
    Authorization: string;
  };
  request?: FastifyRequest;
  reply?: FastifyReply;
}) {
  if (connectionParams || !request) {
    try {
      return {
        user: await app.jwt.verify<CtxUser>(
          connectionParams?.Authorization || ""
        ),
      };
    } catch (error) {
      return { user: null };
    }
  }

  try {
    const user = await request?.jwtVerify<CtxUser>();
    return { request, reply, user };
  } catch (error) {}

  return { reply, request };
}

export type Context = Awaited<ReturnType<typeof buildContext>>;

export async function createServer() {
  const schema = await buildSchema({
    resolvers: [UserResolver],
    authChecker: bearerAuthChecker,
  });

  const server = new ApolloServer({
    schema,
    plugins: [
      fastifyAppClosePlugin(app),
      ApolloServerPluginDrainHttpServer({ httpServer: app.server }),
    ],
    context: buildContext,
  });

  subscriptionServer({ schema, server: app.server });
  return { app, server };
}

const subscriptionServer = function ({
  schema,
  server,
}: {
  schema: GraphQLSchema;
  server: typeof app.server;
}) {
  return SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      async onConnect(connectionParams: { Authorization: string }) {
        return buildContext({ connectionParams });
      },
    },
    {
      server,
      path: "/graphql",
    }
  );
};
