"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [rating, setRating] = useState("");
  const [sort, setSort] = useState("");

  function load() {
    const params = new URLSearchParams();

    if (query) params.append("q", query);
    if (category) params.append("category", category);
    if (min) params.append("min", min);
    if (max) params.append("max", max);
    if (rating) params.append("rating", rating);
    if (sort) params.append("sort", sort);

    fetch("/api/products?" + params.toString())
      .then(r => r.json())
      .then(d => setProducts(d.data));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container">
      <h2>Products</h2>

      {/* CONTROLS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <input
          className="input"
          placeholder="Search product name…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        <select className="input" onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Gadget & Tech">Gadget & Tech</option>
          <option value="Lifestyle">Lifestyle</option>
          <option value="Home & Living">Home & Living</option>
          <option value="Lain-lain">Lain-lain</option>
        </select>

        <select className="input" onChange={e => setSort(e.target.value)}>
          <option value="">Sort Default</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="rating_desc">Rating: Highest</option>
        </select>
      </div>

      <br />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <input className="input" placeholder="Min price" onChange={e => setMin(e.target.value)} />
        <input className="input" placeholder="Max price" onChange={e => setMax(e.target.value)} />
        <select className="input" onChange={e => setRating(e.target.value)}>
          <option value="">Min Rating</option>
          <option value="4">4★+</option>
          <option value="4.5">4.5★+</option>
        </select>
      </div>

      <br />

      <button className="btn" onClick={load}>Apply</button>

      <br /><br />

      {/* PRODUCT GRID */}
      <div className="grid">
        {products.map(p => (
          <div key={p.id} className="card">
            <h3>{p.name}</h3>

            <p>Category: {p.category}</p>
            <p>⭐ {p.rating}</p>

            <p style={{ fontWeight: "bold" }}>
              Rp {p.price.toLocaleString()}
            </p>

            <a href={`/product/${p.id}`}>
              <button className="btn">Detail</button>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
