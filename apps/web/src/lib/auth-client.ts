import { createAuthClient } from "better-auth/client";
import { createAuthClient as createAuthClientVue } from "better-auth/vue";
import {
  usernameClient,
  adminClient,
  emailOTPClient,
} from "better-auth/client/plugins";
import { config } from "@growserver/config";

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return `https://${config.web.loginUrl}`;
};

export const authVanilla = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [usernameClient(), adminClient(), emailOTPClient()],
});


export const authVue = createAuthClientVue({
  baseURL: getBaseURL(),
  plugins: [usernameClient(), adminClient(), emailOTPClient()],
});



