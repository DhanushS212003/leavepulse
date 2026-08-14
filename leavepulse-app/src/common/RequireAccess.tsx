import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppContext, type User } from "../context";

type Props = {
  access: keyof User["access"];
  children: ReactNode;
};

const RequireAccess = ({ access, children }: Props) => {
  const { currentUser } = useAppContext();

  if (!currentUser) return;

  if (!currentUser.access[access]) return <Navigate to="/" />;

  return children;
};

export default RequireAccess;
