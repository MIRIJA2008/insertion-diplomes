import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth";

const ROUTE_PAR_ROLE: Record<string, string> = {
  ADMIN: "/tableau-de-bord",
  CONSULTANT: "/tableau-de-bord",
  RECRUTEUR: "/recruteur",
  CANDIDAT: "/candidat",
};

export default function RequireRole({ roles }: { roles: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    return <Navigate to={ROUTE_PAR_ROLE[user.role] ?? "/"} replace />;
  }
  return <Outlet />;
}