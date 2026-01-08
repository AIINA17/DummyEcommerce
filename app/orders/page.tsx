"use client";

import { useEffect, useState } from "react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  async function load() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data.data || []);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="container">
      <h2>Orders</h2>

      {orders.length === 0 && <p>No orders yet.</p>}

      {/* HEADER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
          fontWeight: "bold",
          borderBottom: "2px solid #ddd",
          padding: "10px 0",
          marginBottom: 10
        }}
      >
        <div>Order ID</div>
        <div>Status</div>
        <div>Payment</div>
        <div>Total</div>
        <div></div>
      </div>

      {/* ROWS */}
      {orders.map(o => (
        <div
          key={o.id}
          className="card"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
            alignItems: "center",
            marginBottom: 10
          }}
        >
          <div><b>#{o.id}</b></div>

          <div>
            {o.status === "paid"
              ? <span className="status-paid">🟢 PAID</span>
              : <span className="status-pending">🟡 PENDING</span>}
          </div>

          <div>{o.payment_method}</div>

          <div>
            Rp {o.total.toLocaleString()}
          </div>

          <div>
            <a href={`/order/${o.id}`}>
              <button className="btn">Detail</button>
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
