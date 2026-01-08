"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(d => setProduct(d.data));
  }, [id]);

  if (!product) return <div className="container">Loading…</div>;

  return (
    <div className="container">
      <h2>{product.name}</h2>

      <p><b>Category:</b> {product.category}</p>

      <p><b>Rating:</b> ⭐ {product.rating}</p>

      <p><b>Price:</b> Rp {product.price.toLocaleString()}</p>

      <a href={`/checkout/${id}`}>
        <button className="btn">Buy Now</button>
      </a>

      <br /><br />

      <a href="/">← Back</a>
    </div>
  );
}
