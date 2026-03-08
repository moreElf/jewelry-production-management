import Link from "next/link";

import { CreateOrderForm, OrderFilters } from "@/components/order-forms";
import { EmptyState, StatusPill } from "@/components/ui";
import { STATUS_LABELS } from "@/lib/constants";
import { getOrders, getReferenceData } from "@/lib/data";
import { formatDate, isDelayed } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = {
    status: typeof searchParams.status === "string" ? searchParams.status : undefined,
    processId: typeof searchParams.processId === "string" ? searchParams.processId : undefined,
    assigneeId: typeof searchParams.assigneeId === "string" ? searchParams.assigneeId : undefined,
  };

  const [referenceData, ordersResult] = await Promise.all([
    getReferenceData(),
    getOrders(filters),
  ]);
  const orders = ordersResult.orders;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Production Orders</p>
          <h1>Order list</h1>
          <p className="section-copy">Track current process, assignment, due dates, and open issues in one table.</p>
        </div>
      </header>

      {referenceData.databaseUnavailable || ordersResult.databaseUnavailable ? (
        <EmptyState
          title="Database unavailable"
          copy="Prisma could not reach the configured database service. Start the local Prisma/Postgres instance or replace DATABASE_URL with a reachable PostgreSQL connection."
        />
      ) : (
        <>
          <CreateOrderForm referenceData={referenceData} />
          <OrderFilters referenceData={referenceData} searchParams={searchParams} />
          {orders.length === 0 ? (
            <EmptyState
              title="No orders found"
              copy="Try widening the filters or create a new production order."
            />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Due date</th>
                    <th>Current process</th>
                    <th>Assignee</th>
                    <th>Status</th>
                    <th>Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link href={`/orders/${order.id}`} className="mono">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td>{order.product.name}</td>
                      <td>{order.quantity}</td>
                      <td>
                        {formatDate(order.dueDate)}
                        {isDelayed(order.dueDate) ? <div className="pill danger">Delayed</div> : null}
                      </td>
                      <td>{order.currentProcess?.name ?? "-"}</td>
                      <td>{order.currentAssignedUser?.name ?? "Unassigned"}</td>
                      <td>
                        <StatusPill>{STATUS_LABELS[order.status]}</StatusPill>
                      </td>
                      <td>{order.issues.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
