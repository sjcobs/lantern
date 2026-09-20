import sdk from "@1password/sdk";

const token = process.env.OP_SERVICE_ACCOUNT_TOKEN;
if (!token) {
  throw new Error("OP_SERVICE_ACCOUNT_TOKEN is missing");
}

export const op = await sdk.createClient({
  auth: token,
  integrationName: "Lantern",
  integrationVersion: "v0.1.0",
});
