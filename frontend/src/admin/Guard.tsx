import { Navigate } from "react-router-dom";
import { getToken, getRole } from "./api";

type Role = "admin" | "editor" | "viewer";

interface GuardProps {
  children: JSX.Element;
  allow?: Role[];
}

export default function Guard({
  children,
  allow = ["admin", "editor", "viewer"],
}: GuardProps) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // Проверка роли на клиенте для быстрого UX (бэкенд всё равно проверит)
  const role = getRole();
  if (role && !allow.includes(role)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
