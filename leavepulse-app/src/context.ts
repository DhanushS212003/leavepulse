import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from "react";

export type User = {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  org_id: number;
  access: {
    manage_leave_types: boolean;
    manage_employees: boolean;
    manage_org: boolean;
    manage_team_leaves: boolean;
  };
};

export type AppContextValue = {
  currentUser: User | null;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
};

export const AppContext = createContext<AppContextValue | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppContext.Provider");
  }
  return context;
};
