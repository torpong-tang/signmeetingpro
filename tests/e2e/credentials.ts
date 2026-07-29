const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
  throw new Error(
    "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required for Playwright tests.",
  );
}

export { adminEmail, adminPassword };
