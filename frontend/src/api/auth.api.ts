import { api } from "@/lib/api";
import type { LoginResponseData } from "@/types";

export const authApi = {
  login: (payload: { email: string; password: string; latitude?: number; longitude?: number }) =>
    api.post<LoginResponseData>("/auth/login", payload),

  logout: () => api.post("/auth/logout"),

  refresh: () => api.post<{ accessToken: string }>("/auth/refresh"),

  me: () => api.get<{ userId: string; email: string; role: string }>("/auth/me"),
};
