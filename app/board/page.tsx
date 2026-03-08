import Link from "next/link";

import { StatusPill } from "@/components/ui";
import { getBoardData } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const { columns, databaseUnavailable } = await getBoardData();

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Process Board</p>
          <h1>Read-only kanban</h1>
          <p className="section-copy">
            Orders are grouped by current process stage. Rework is visible in the order detail history.
          </p>
        </div>
      </header>

      <section className="board">
        {databaseUnavailable ? (
          <div className="board-column">
            <h2>Database not ready</h2>
            <p className="section-copy">
              Prisma could not load board data. On Vercel, this usually means the hosted Postgres
              connection is missing or the Prisma schema has not been pushed yet.
            </p>
          </div>
        ) : null}
        {columns.map((column) => (
          <div key={column.id} className="board-column">
            <div className="split">
              <h2>{column.name}</h2>
              <StatusPill>{column.currentOrders.length}</StatusPill>
            </div>
            <div className="board-stack">
              {column.currentOrders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`} className="order-card">
                  <div className="split">
                    <strong className="mono">{order.orderNumber}</strong>
                    <StatusPill>{order.status}</StatusPill>
                  </div>
                  <p>{order.product.name}</p>
                  <p className="muted">Qty {order.quantity}</p>
                  <p className="muted">Due {formatDate(order.dueDate)}</p>
                  <p className="muted">Assignee {order.currentAssignedUser?.name ?? "Unassigned"}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
