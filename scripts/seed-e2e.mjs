// Menyiapkan akun uji dengan kredensial dan saldo yang diketahui.
//
// Tes belanja betulan memotong saldo, jadi tanpa reset run berikutnya mulai
// dengan saldo yang sudah terpakai dan akhirnya gagal karena saldo habis —
// bukan karena aplikasinya rusak. Skrip ini dipanggil Playwright lewat
// globalSetup sebelum suite jalan.

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import bcrypt from "bcrypt";
import { config } from "dotenv";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: join(root, ".env.local") });

if (!process.env.DATABASE_URL) {
  console.error("\n  DATABASE_URL kosong. Isi .env.local dulu.\n");
  process.exit(1);
}

const USERNAME = process.env.E2E_USERNAME ?? "demo";
const PASSWORD = process.env.E2E_PASSWORD ?? "demo123";
const BALANCE = 5_000_000_000;

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const hash = await bcrypt.hash(PASSWORD, 10);

await pool.query(
  `INSERT INTO users (username, password, email, phone, address, balance)
   VALUES ($1, $2, $3, $4, $5, $6)
   ON CONFLICT (username) DO UPDATE
     SET password = EXCLUDED.password,
         balance  = EXCLUDED.balance`,
  [
    USERNAME,
    hash,
    `${USERNAME}@shopku.test`,
    "081234567890",
    "Jl. Merdeka No. 17, Jakarta Pusat, DKI Jakarta 10110",
    BALANCE,
  ]
);

// Keranjang dikosongkan supaya assertion "keranjang kosong" tidak mewarisi
// sisa dari run sebelumnya.
await pool.query(
  `DELETE FROM cart WHERE user_id = (SELECT id FROM users WHERE username = $1)`,
  [USERNAME]
);

console.log(`  Akun uji siap → ${USERNAME} / ${PASSWORD}`);
await pool.end();
