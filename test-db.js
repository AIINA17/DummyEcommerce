const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:kebelet_eek@db.wboqimudhbpheqloamch.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    // Cek koneksi
    const result = await pool.query('SELECT NOW()');
    console.log('Connected! Time:', result.rows[0].now);
    
    // Cek tabel yang ada
    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log('Tables:', tables.rows);
    
    // Cek apakah tabel users ada
    const usersTable = tables.rows.find(t => t.table_name === 'users');
    if (!usersTable) {
      console.log('\n❌ Tabel "users" BELUM ADA!');
      console.log('Jalankan SQL ini di Supabase:');
      console.log(`
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);
`);
    } else {
      console.log('\n✅ Tabel "users" sudah ada');
      
      // Cek struktur tabel
      const columns = await pool.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'"
      );
      console.log('Columns:', columns.rows);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

test();
