import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "replace_me"; // совпадает с backend/.env.example

type Role = "admin" | "editor" | "viewer";
export function makeToken(
  role: Role,
  email = `tester+${role}@local`,
  id = "e2e-user",
) {
  const payload = { id, email, role };
  return jwt.sign(payload, SECRET, { expiresIn: "15m" });
}
