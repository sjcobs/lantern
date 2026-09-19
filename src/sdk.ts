import sdk from "@1password/sdk";

export const op = await sdk.createClient({
  auth: process.env.OP_SERVICE_ACCOUNT_TOKEN,
  integrationName: "Lantern",
  integrationVersion: "v0.1.0",
});
