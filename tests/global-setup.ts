import { execFileSync } from "node:child_process";

/** Siapkan akun uji + kosongkan keranjangnya. Lihat scripts/seed-e2e.mjs. */
export default function globalSetup() {
  execFileSync("node", ["scripts/seed-e2e.mjs"], { stdio: "inherit" });
}
