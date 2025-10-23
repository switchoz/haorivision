import pino from "pino";
import pinoHttp from "pino-http";

const level = process.env.LOG_LEVEL || "info";
export const baseLogger = pino({
  level,
  redact: ["req.headers.authorization", "password", "token"],
});

export default function httpLogger() {
  return pinoHttp({
    logger: baseLogger,
    useLevel: "info",
    customProps: (req, res) => ({
      reqId: req.id,
      user: req.user?.id || null,
    }),
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url, ip: req.ip };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
      err(err) {
        return { type: err.name, msg: err.message, stack: err.stack };
      },
    },
  });
}
