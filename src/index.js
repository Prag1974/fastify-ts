"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const session_1 = __importDefault(require("@fastify/session"));
const db_1 = require("./libs/db");
const fastify = (0, fastify_1.default)();
const PORT = 3000;
fastify.register(cookie_1.default, {});
fastify.register(session_1.default, {
    store: {
        set(sessionId, session, callback) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield db_1.db.session.upsert({
                        where: {
                            id: sessionId,
                        },
                        update: {
                            data: session,
                        },
                        create: {
                            id: sessionId,
                            data: session,
                        },
                    });
                    return callback(undefined);
                }
                catch (error) {
                    return callback(error);
                }
            });
        },
        get(sessionId, callbackSession) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const storedSession = yield db_1.db.session.findUnique({
                        where: { id: sessionId },
                    });
                    if (!storedSession)
                        throw Error("Session couldn't found!");
                    const session = Object.assign({}, storedSession.data);
                    callbackSession(undefined, session);
                }
                catch (error) {
                    callbackSession(error, undefined);
                }
            });
        },
        destroy(sessionId, callback) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    console.log("Destroy fired");
                    const deleted = yield db_1.db.session.delete({ where: { id: sessionId } });
                    if (!deleted)
                        throw Error("Couldnt found to destroy a session!");
                    callback(undefined);
                }
                catch (error) {
                    callback(error);
                }
            });
        },
    },
    secret: "supersecretkeysupersecretkeysupersecretkeysupersecretkey",
    cookie: {
        secure: false,
        maxAge: 1000 * 15, // 15 seconds
    },
});
fastify.get("/", (req, res) => {
    req.session.gotItFromBaseURL = true;
    console.log(req.session.sessionId);
    return res.send(req.session);
});
try {
    fastify.listen({ port: PORT });
    console.log(`Server is listening port ${PORT}`);
}
catch (error) {
    fastify.log.error(error);
    process.exit(1);
}
