"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Checkout() {
  const { id } = useParams();

  const [product, setProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [payment, setPayment] = useState("VA BCA");

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(d => setProduct(d.data));
  }, []);

  async function placeOrder() {
    await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        product_id: Number(id),
        qty,
        payment_method: payment
      })
    });

    window.location.href = "/orders";
  }

  if (!product) return <div className="container">Loading…</div>;

  return (
    <div className="container">
      <h2>Checkout</h2>

      <p>
        <b>{product.name}</b><br/>
        ⭐ {product.rating}<br/>
        Rp {product.price.toLocaleString()}
      </p>

      <label>Quantity</label>
      <input
        className="input"
        type="number"
        min={1}
        value={qty}
        onChange={e => setQty(Number(e.target.value))}
      />

      <label>Payment Method</label>
      <select
        className="input"
        value={payment}
        onChange={e => setPayment(e.target.value)}
      >
        <option value="VA BCA">VA BCA</option>
        <option value="VA BRI">VA BRI</option>
        <option value="GoPay">GoPay</option>
        <option value="OVO">OVO</option>
        <option value="ShopeePay">ShopeePay</option>
      </select>

      <button className="btn" onClick={placeOrder}>
        Place Order
      </button>
    </div>
  );
}
