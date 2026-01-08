"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);

  async function load() {
    const res = await fetch(`/api/orders/${id}`);
    const data = await res.json();
    setOrder(data.data);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 1000);
    return () => clearInterval(t);
  }, []);

  if (!order) return <div className="container">Loading…</div>;

  return (
    <div className="container">
      <h2>Order #{order.id}</h2>

      <p>Status: {order.status === "paid" ? "🟢 PAID" : "🟡 PENDING"}</p>

      <p>Payment method: <b>{order.payment_method}</b></p>

      <h3>Items</h3>

      <ul>
        {order.items.map((it: any, idx: number) => (
          <li key={idx}>
            {it.name_snapshot}
            — Rp {it.price_at_purchase.toLocaleString()}
            × {it.qty}
          </li>
        ))}
      </ul>

      <p><b>Total:</b> Rp {order.total.toLocaleString()}</p>

      {order.status !== "paid" && (
        <button
          className="btn"
          onClick={async () => {
            await fetch(`/api/orders/${order.id}/pay`, { method: "POST" });
          }}
        >
          Simulate Payment
        </button>
      )}

      <br/><br/>

      <a href="/orders">← Back</a>
    </div>
  );
}
