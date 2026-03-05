// ── Auth types ──

export type UserRole = "admin" | "employee";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  empId?: string | null;
  officeLocationRequired?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
  latitude?: number;
  longitude?: number;
}

export interface LoginResponseData {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    empId?: string | null;
    officeLocationRequired?: boolean;
  };
}

export type AuthStatus =
  | "idle"
  | "checking"
  | "authenticated"
  | "unauthenticated"
  | "redirecting";

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authStatus: AuthStatus;
  login: (payload: LoginPayload) => Promise<User | null>;
  logout: () => void;
}
