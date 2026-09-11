import { defineRailway, postgres, preserve, project, service, volume } from "railway/iac";

export default defineRailway(() => {
  const Postgres = postgres("Postgres", { region: "us-east4-eqdc4a" });
  Postgres.networking = { privateNetworkEndpoint: "postgres" };
  const doorloopAiBotsVolume = volume("doorloop-ai-bots-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "us-east4-eqdc4a", sizeMB: 50000 });
  const postgresVolume = volume("postgres-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "us-east4-eqdc4a", sizeMB: 50000 });
  const doorloopAiBots = service("doorloop-ai-bots", {
    replicas: { "us-east4-eqdc4a": 1 },
    volumeMounts: { "/data": doorloopAiBotsVolume },
    // `railway.json`'s deploy block does not persist these as durable service
    // settings -- `railway config pull` comes back without them. Declaring them
    // here is what actually makes them stick, and without `start` the service
    // silently runs the Dockerfile's default CMD: the API alone, no worker, no web.
    builder: "DOCKERFILE",
    dockerfilePath: "infra/compose/Dockerfile",
    start: "bash infra/railway/entrypoint.sh",
    healthcheck: "/health",
    healthcheckTimeout: 300,
    restartPolicyType: "ON_FAILURE",
    restartPolicyMaxRetries: 10,
    env: { AGENT_RUNTIME: preserve(), API_HOST: preserve(), API_PROXY_TARGET: preserve(), API_URL: preserve(), BETTER_AUTH_SECRET: preserve(), BETTER_AUTH_URL: preserve(), COMPOSIO_API_KEY: preserve(), DATABASE_URL: preserve(), DATA_DIR: preserve(), E2B_API_KEY: preserve(), ENCRYPTION_KEY: preserve(), NODE_ENV: preserve(), RAILWAY_DOCKERFILE_PATH: preserve(), RAILWAY_RUN_UID: preserve(), RAKAZO_ADDITIONAL_ALLOWED_HOSTS: preserve(), RAKAZO_HOST: preserve(), SANDBOX_PROVIDER: preserve(), SCREEN_PROXY_SECRET: preserve(), SIGNUPS_ENABLED: preserve(), SIGNUP_ALLOWLIST: preserve(), WAKEUP_DRIVER: preserve(), WEB_ORIGIN: preserve() },
  });

  return project("doorloop-ai-bots", {
    resources: [doorloopAiBots, Postgres, doorloopAiBotsVolume, postgresVolume],
  });
});
