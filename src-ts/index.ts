import Fastify, { FastifyReply, FastifyRequest, Session } from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import { db } from "./libs/db";

declare module "fastify" {
  interface Session {
    gotItFromBaseURL?: boolean;
    gotItFromTestURL?: boolean;
  }
}

const fastify = Fastify();

const PORT = 3000;

fastify.register(fastifyCookie, {});
fastify.register(fastifySession, {
  store: {
    async set(
      sessionId: string,
      session: Session,
      callback: (err?: any) => void
    ) {
      try {
        await db.session.upsert({
          where: {
            id: sessionId,
          },
          update: {
            data: session as any,
          },
          create: {
            id: sessionId,
            data: session as any,
          },
        });
        return callback(undefined);
      } catch (error) {
        return callback(error);
      }
    },
    async get(
      sessionId: string,
      callbackSession: (err: any, result?: Session) => void
    ) {
      try {
        const storedSession = await db.session.findUnique({
          where: { id: sessionId },
        });

        if (!storedSession) throw Error("Session couldn't found!");

        const session: Session = {
          ...(storedSession.data as any),
        };

        callbackSession(undefined, session);
      } catch (error) {
        callbackSession(error, undefined);
      }
    },
    async destroy(sessionId: string, callback: (err?: any) => void) {
      try {
        console.log("Destroy fired");
        const deleted = await db.session.delete({ where: { id: sessionId } });
        if (!deleted) throw Error("Couldnt found to destroy a session!");

        callback(undefined);
      } catch (error) {
        callback(error);
      }
    },
  },
  secret: "supersecretkeysupersecretkeysupersecretkeysupersecretkey",
  cookie: {
    secure: false,
    maxAge: 1000 * 15, // 15 seconds
  },
});

fastify.get("/", (req: FastifyRequest, res: FastifyReply) => {
  req.session.gotItFromBaseURL = true;
  console.log(req.session.sessionId);
  return res.send(req.session);
});

try {
  fastify.listen({ port: PORT });
  console.log(`Server is listening port ${PORT}`);
} catch (error) {
  fastify.log.error(error);
  process.exit(1);
}
