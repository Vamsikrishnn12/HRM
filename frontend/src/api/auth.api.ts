import { api } from "@/lib/api";
import type { LoginResponseData } from "@/types";

export const authApi = {
  login: (payload: { email: string; password: string; latitude?: number; longitude?: number; portal?: "EMPLOYEE" | "HR" }) =>
    api.post<LoginResponseData>("/auth/login", payload),

  portalOptions: (email: string) =>
    api.post<{ employeeLogin: boolean; hrLogin: boolean }>("/auth/portal-options", { email }),

  logout: () => api.post("/auth/logout"),

  refresh: () => api.post<{ accessToken: string }>("/auth/refresh"),

  me: () => api.get<{ userId: string; email: string; role: string }>("/auth/me"),
};
