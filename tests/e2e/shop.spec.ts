import { expect, test, type Page } from "@playwright/test";

const DEMO = {
  username: process.env.E2E_USERNAME ?? "demo",
  password: process.env.E2E_PASSWORD ?? "demo123",
};

/**
 * Locator yang hanya menghitung elemen yang benar-benar terlihat.
 *
 * Grid produk dirender ulang tiap filter berubah; selama transisi, node lama
 * bisa masih ada di DOM sesaat. Locator biasa ikut menghitungnya.
 */
function visible(page: Page, testId: string) {
  return page.getByTestId(testId).filter({ visible: true });
}

/** Tunggu grid berhenti berubah — dua pengambilan berturut-turut sama & bukan nol. */
async function settledCards(page: Page) {
  const cards = visible(page, "product-card");
  await expect
    .poll(async () => {
      const first = await cards.count();
      if (first === 0) return 0;
      await page.waitForTimeout(150);
      return first === (await cards.count()) ? first : 0;
    })
    .toBeGreaterThan(0);
  return cards;
}

/**
 * Tunggu jumlah kartu benar-benar MENGECIL dari `before`.
 *
 * settledCards saja tidak cukup di sini: tepat setelah filter diklik, grid
 * masih menampilkan hasil lama, jadi dua pengambilan berturut-turut sama dan
 * helper itu langsung "settle" pada angka yang belum diperbarui. Menunggu
 * n > 0 DAN n < before menyingkirkan baik data lama maupun fase skeleton.
 */
async function narrowedTo(page: Page, before: number) {
  const cards = visible(page, "product-card");
  await expect
    .poll(async () => {
      const n = await cards.count();
      return n > 0 && n < before;
    })
    .toBe(true);
  return cards.count();
}

/** "Rp1.735.000" → 1735000 */
function toNumber(text: string): number {
  return Number(text.replace(/\D/g, ""));
}

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Username").fill(DEMO.username);
  await page.getByLabel("Password", { exact: true }).fill(DEMO.password);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByRole("button", { name: "Menu akun" })).toBeVisible();
}

test.describe("Katalog", () => {
  test("beranda memuat hero dan grid produk", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/ShopKu/);
    await expect(
      page.getByRole("heading", { name: /Barang bagus/i })
    ).toBeVisible();
    await expect((await settledCards(page)).first()).toBeVisible();
  });

  test("pencarian dari header menyaring hasil dan tersimpan di URL", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByLabel("Cari produk").fill("laptop");
    await page.getByLabel("Cari produk").press("Enter");

    await expect(page).toHaveURL(/\?q=laptop/);
    await expect(page.getByText(/untuk\s+“?laptop/i)).toBeVisible();
  });

  test("pencarian dan semua chip kategori tetap terjangkau di layar kecil", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // Kolom pencarian pindah ke baris kedua di mobile, bukan disembunyikan.
    await expect(page.getByLabel("Cari produk")).toBeVisible();

    for (const name of ["Semua", "Gadget & Tech", "Lain-lain"]) {
      await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
    }

    // Halaman tidak boleh bisa digeser ke samping.
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(overflows).toBe(false);
  });

  test("filter kategori mempersempit hasil", async ({ page }) => {
    await page.goto("/");
    const before = await (await settledCards(page)).count();

    await page.getByRole("button", { name: "Home & Living" }).click();

    // Filter hidup di URL — inilah alasannya bisa dibagikan lewat tautan.
    await expect(page).toHaveURL(/category=Home/);

    const after = await narrowedTo(page, before);
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);
  });

  test("urutkan harga terendah benar-benar menaik", async ({ page }) => {
    await page.goto("/?sort=price_asc");
    await settledCards(page);

    const prices = (await visible(page, "card-price").allInnerTexts()).map(
      toNumber
    );

    expect(prices.length).toBeGreaterThan(1);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test("halaman produk menampilkan harga, aksi, dan produk serupa", async ({
    page,
  }) => {
    await page.goto("/");
    await (await settledCards(page)).first().click();

    await expect(page).toHaveURL(/\/product\/\d+/);
    await expect(page.getByTestId("product-price")).toBeVisible();
    await expect(page.getByTestId("add-to-cart")).toBeVisible();
    await expect(page.getByTestId("buy-now")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Deskripsi" })).toBeVisible();
  });

  test("subtotal ikut jumlah yang dipilih", async ({ page }) => {
    await page.goto("/");
    await (await settledCards(page)).first().click();
    await expect(page.getByTestId("product-price")).toBeVisible();

    const unit = toNumber(await page.getByTestId("product-price").innerText());
    await page.getByLabel("Tambah jumlah").click();

    await expect
      .poll(async () => toNumber(await page.getByTestId("subtotal").innerText()))
      .toBe(unit * 2);
  });
});

test.describe("Autentikasi", () => {
  test("kredensial salah menampilkan pesan error, bukan crash", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Username").fill(DEMO.username);
    await page.getByLabel("Password", { exact: true }).fill("password-salah");
    await page.getByRole("button", { name: "Masuk" }).click();

    await expect(page.getByTestId("auth-error")).toHaveText(
      /Username atau password salah/
    );
  });

  test("halaman yang butuh login mengalihkan ke /login", async ({ page }) => {
    await page.goto("/orders");
    await expect(page).toHaveURL(/\/login/);
  });

  test("syarat pendaftaran tercentang sambil mengetik", async ({ page }) => {
    await page.goto("/register");

    const submit = page.getByRole("button", { name: "Daftar" });
    await expect(submit).toBeDisabled();

    await page.getByLabel("Username").fill("ab");
    await page.getByLabel("Password", { exact: true }).fill("12345");
    await expect(submit).toBeDisabled();

    await page.getByLabel("Username").fill("pengguna-baru");
    await page.getByLabel("Password", { exact: true }).fill("rahasia123");
    await expect(submit).toBeEnabled();
  });
});

test.describe("Alur belanja", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);

    // Data uji hidup di database sungguhan — kosongkan keranjang supaya sisa
    // dari run sebelumnya tidak bocor ke assertion berikutnya.
    const res = await page.request.get("/api/cart");
    const { data } = await res.json();
    for (const item of data ?? []) {
      await page.request.delete(`/api/cart?cart_id=${item.id}`);
    }
  });

  test("tambah ke keranjang dari kartu produk, ubah jumlah, lalu hapus", async ({
    page,
  }) => {
    await page.goto("/");
    await settledCards(page);
    await visible(page, "card-add-to-cart").first().click();
    await expect(page.getByText("masuk keranjang")).toBeVisible();

    await page.goto("/cart");
    const row = page.getByTestId("cart-item").first();
    await expect(row).toBeVisible();

    const before = toNumber(await page.getByTestId("cart-total").innerText());
    await row.getByRole("button", { name: "Tambah" }).click();
    await expect
      .poll(async () => toNumber(await page.getByTestId("cart-total").innerText()))
      .toBeGreaterThan(before);

    await row.getByRole("button", { name: /^Hapus/ }).click();
    await expect(page.getByText("Keranjang kamu masih kosong")).toBeVisible();
  });

  test("checkout dari keranjang memotong saldo dan menandai lunas", async ({
    page,
  }) => {
    await page.goto("/profile");
    const balanceBefore = toNumber(
      await page.getByTestId("wallet-balance").innerText()
    );

    await page.goto("/");
    await settledCards(page);
    await visible(page, "card-add-to-cart").first().click();
    await expect(page.getByText("masuk keranjang")).toBeVisible();

    await page.goto("/cart");
    await page.getByTestId("checkout-button").click();

    await expect(page).toHaveURL(/\/checkout/);
    const total = toNumber(await page.getByTestId("checkout-total").innerText());

    await page.getByTestId("pay-button").click();

    await expect(page).toHaveURL(/\/order\/\d+/);
    await expect(page.getByTestId("order-status")).toHaveText("Dibayar");
    await expect
      .poll(async () => toNumber(await page.getByTestId("order-total").innerText()))
      .toBe(total);

    // Saldo berkurang persis sebesar tagihan — bukan sekadar "berubah".
    await page.goto("/profile");
    await expect
      .poll(async () =>
        toNumber(await page.getByTestId("wallet-balance").innerText())
      )
      .toBe(balanceBefore - total);

    // Hanya baris yang dibeli yang dibersihkan dari keranjang.
    await page.goto("/cart");
    await expect(page.getByText("Keranjang kamu masih kosong")).toBeVisible();
  });

  test("beli langsung membuat pesanan tanpa lewat keranjang", async ({ page }) => {
    await page.goto("/");
    await (await settledCards(page)).first().click();
    await page.getByTestId("buy-now").click();

    await expect(page).toHaveURL(/\/checkout\/\d+/);
    await page.getByRole("radio", { name: /Virtual Account BCA/ }).click();
    await page.getByTestId("pay-button").click();

    await expect(page).toHaveURL(/\/order\/\d+/);
    await expect(page.getByTestId("order-status")).toHaveText(
      "Menunggu pembayaran"
    );

    await page.getByTestId("pay-now").click();
    await expect(page.getByTestId("order-status")).toHaveText("Dibayar");

    // Keranjang tidak tersentuh oleh alur "beli langsung".
    await page.goto("/cart");
    await expect(page.getByText("Keranjang kamu masih kosong")).toBeVisible();
  });

  test("pesanan muncul di daftar transaksi dan tab menyaring", async ({
    page,
  }) => {
    await page.goto("/orders");
    await expect(page.getByTestId("order-row").first()).toBeVisible();

    await page.getByRole("tab", { name: /Dibayar/ }).click();
    const rows = page.getByTestId("order-row");
    await expect(rows.first()).toBeVisible();
    for (const badge of await page.getByTestId("order-status").all()) {
      await expect(badge).toHaveText("Dibayar");
    }
  });

  test("profil tersimpan dan bertahan setelah reload", async ({ page }) => {
    const address = `Jl. Uji Coba No. ${Date.now() % 1000}, Jakarta Pusat`;

    await page.goto("/profile");
    await page.getByLabel("Alamat lengkap").fill(address);
    await page.getByTestId("save-profile").click();
    await expect(page.getByText("Profil tersimpan")).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Alamat lengkap")).toHaveValue(address);
  });
});

test.describe("Keamanan API", () => {
  test("endpoint privat menolak permintaan tanpa login", async ({ request }) => {
    for (const path of ["/api/cart", "/api/orders", "/api/user", "/api/me"]) {
      expect((await request.get(path)).status(), path).toBe(401);
    }
  });

  test("harga diambil dari server, bukan dari body permintaan", async ({
    page,
  }) => {
    await login(page);

    const listing = await page.request.get("/api/products");
    const first = (await listing.json()).data[0];

    // Klien mengirim harga karangan; server harus mengabaikannya.
    const res = await page.request.post("/api/orders", {
      data: {
        items: [{ product_id: first.id, quantity: 1, price: 1 }],
        payment_method: "VA_BCA",
      },
    });

    expect(res.ok()).toBe(true);
    const { data: order } = await res.json();
    expect(Number(order.items[0].price_at_purchase)).toBe(Number(first.price));
  });

  test("pesanan milik orang lain tidak bisa dibuka", async ({ page }) => {
    await login(page);
    const res = await page.request.get("/api/orders/999999");
    expect([403, 404]).toContain(res.status());
  });
});
