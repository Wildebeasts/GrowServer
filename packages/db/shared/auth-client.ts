import { createAuthClient } from "better-auth/vue";
import { usernameClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { emailOTPClient } from "better-auth/client/plugins";
import { config } from "@growserver/config";

export const authClient = createAuthClient({
  baseURL: `https://${config.web.loginUrl}`,
  plugins: [
    usernameClient(),
    adminClient(),
    emailOTPClient()
  ]
});