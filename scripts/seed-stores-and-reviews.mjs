import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: join(root, ".env.local") });

if (!process.env.DATABASE_URL) {
  console.error("\n  DATABASE_URL kosong. Isi .env.local dulu.\n");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const STORES_BY_CATEGORY = {
  "Gadget & Tech": [
    { name: "TechHub Elektronik", city: "Jakarta Selatan" },
    { name: "Gadgetin Store", city: "Surabaya" },
    { name: "Digital Point", city: "Bandung" },
  ],
  "Home & Living": [
    { name: "Griya Living", city: "Yogyakarta" },
    { name: "Rumah & Dekor Co.", city: "Semarang" },
  ],
  Lifestyle: [
    { name: "Urban Lifestyle Market", city: "Denpasar" },
    { name: "Daily Living Store", city: "Malang" },
  ],
  "Lain-lain": [
    { name: "Toko Serba Ada Nusantara", city: "Medan" },
    { name: "Pasar Digital", city: "Makassar" },
  ],
};

const REVIEWERS = [
  "Dian",
  "Budi",
  "Siti",
  "Agus",
  "Rina",
  "Fajar",
  "Lestari",
  "Bayu",
];

const COMMENTS = {
  5: [
    "Produk mantap, sesuai deskripsi!",
    "Puas banget, kualitas bagus.",
    "Recommended, cepat sampai.",
  ],
  4: [
    "Bagus, cuma pengiriman agak lama.",
    "Sesuai ekspektasi.",
    "Worth it harganya.",
  ],
  3: ["Standar aja, gak istimewa.", "Lumayan, ada kekurangan kecil."],
  2: ["Kurang sesuai gambar.", "Agak kecewa sama kualitasnya."],
  1: ["Barang rusak saat sampai.", "Tidak sesuai deskripsi sama sekali."],
};

async function seedStores(client) {
  const storeIdsByCategory = {};

  for (const [category, stores] of Object.entries(STORES_BY_CATEGORY)) {
    const ids = [];
    for (const store of stores) {
      const res = await client.query(
        `INSERT INTO stores (name, city)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET city = EXCLUDED.city
         RETURNING id`,
        [store.name, store.city],
      );
      ids.push(res.rows[0].id);
    }
    storeIdsByCategory[category] = ids;
  }

  const total = Object.values(storeIdsByCategory).flat().length;
  console.log(
    `  ${total} toko siap, tersebar di ${Object.keys(STORES_BY_CATEGORY).length} kategori.`,
  );
  return storeIdsByCategory;
}

async function assignStoresToProducts(client, storeIdsByCategory) {
  const { rows: products } = await client.query(
    `SELECT id, category FROM products WHERE store_id IS NULL ORDER BY category, id`,
  );

  const countByCategory = {};
  for (const product of products) {
    const storeIds = storeIdsByCategory[product.category];
    if (!storeIds || storeIds.length === 0) {
      console.warn(
        `  Skip produk ${product.id}: kategori "${product.category}" belum punya toko di STORES_BY_CATEGORY.`,
      );
      continue;
    }

    const idx = countByCategory[product.category] ?? 0;
    const storeId = storeIds[idx % storeIds.length];

    await client.query(`UPDATE products SET store_id = $1 WHERE id = $2`, [
      storeId,
      product.id,
    ]);
    countByCategory[product.category] = idx + 1;
  }

  console.log(
    `  ${products.length} produk di-assign ke toko (round-robin per kategori).`,
  );
}

async function seedReviews(client) {
  const { rows: products } = await client.query(
    `SELECT p.id FROM products p
     LEFT JOIN product_reviews r ON r.product_id = p.id
     GROUP BY p.id
     HAVING COUNT(r.id) = 0`,
  );

  let count = 0;
  for (const product of products) {
    const reviewCount = 2 + Math.floor(Math.random() * 4); // 2-5 review per produk
    for (let i = 0; i < reviewCount; i++) {
      const rating = 1 + Math.floor(Math.random() * 5);
      const name = REVIEWERS[Math.floor(Math.random() * REVIEWERS.length)];
      const options = COMMENTS[rating];
      const comment = options[Math.floor(Math.random() * options.length)];

      await client.query(
        `INSERT INTO product_reviews (product_id, reviewer_name, rating, comment)
         VALUES ($1, $2, $3, $4)`,
        [product.id, name, rating, comment],
      );
      count++;
    }
  }
  console.log(`  ${count} review ditambahkan untuk ${products.length} produk.`);
}

async function main() {
  const client = await pool.connect();
  try {
    const storeIdsByCategory = await seedStores(client);
    await assignStoresToProducts(client, storeIdsByCategory);
    await seedReviews(client);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
