import { randomUUID } from "crypto";
export default function requestId(req, _res, next) {
  req.id = req.headers["x-request-id"] || randomUUID();
  next();
}
