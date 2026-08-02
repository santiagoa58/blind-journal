import ky from "ky";
import { API_BASE_URL } from "@/api/constants";

export const api = ky.create({
  prefix: API_BASE_URL,
  credentials: "include",
  headers: {
    Accept: "application/json",
  },
  retry: 0,
  throwHttpErrors: false,
});
