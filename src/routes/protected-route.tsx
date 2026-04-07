import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { selectCurrentUser, useAppStore } from "@/store/useAppStore";
import { Role } from "@/types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const currentUser = useAppStore(selectCurrentUser);

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
