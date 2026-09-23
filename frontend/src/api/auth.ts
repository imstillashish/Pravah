import { apiClient } from "./client";
import type { RegisterPayload } from "../types";

export interface RegisterResponse {
  message: string;
  user_id?: number | string;
}

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  return apiClient<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
