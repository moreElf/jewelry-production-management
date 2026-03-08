import { notFound } from "next/navigation";

import {
  AssignUserForm,
  CreateIssueForm,
  UpdateProcessForm,
} from "@/components/order-forms";
import { SectionCard, StatusPill } from "@/components/ui";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { getOrderDetail, getReferenceData } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductionOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [{ order, databaseUnavailable }, referenceData] = await Promise.all([
    getOrderDetail(params.id),
    getReferenceData(),
  ]);

  if (databaseUnavailable) {
    return (
      <div className="page">
        <header className="page-header">
          <div>
            <p className="eyebrow">Production Order</p>
            <h1>Database unavailable</h1>
            <p className="section-copy">
              Prisma could not reach the configured database service for this order detail view.
            </p>
          </div>
        </header>
      </div>
    );
  }

  if (!order) {
    notFound();
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Production Order</p>
          <h1>{order.orderNumber}</h1>
          <p className="section-copy">
            {order.product.name} x {order.quantity}
          </p>
        </div>
        <StatusPill>{STATUS_LABELS[order.status]}</StatusPill>
      </header>

      <section className="detail-grid">
        <SectionCard title="Order summary" description="Current state and due-date ownership.">
          <div className="summary-grid">
            <article className="card">
              <p className="muted">Current process</p>
              <h3>{order.currentProcess?.name ?? "-"}</h3>
            </article>
            <article className="card">
              <p className="muted">Assignee</p>
              <h3>{order.currentAssignedUser?.name ?? "Unassigned"}</h3>
            </article>
            <article className="card">
              <p className="muted">Due date</p>
              <h3>{formatDate(order.dueDate)}</h3>
            </article>
            <article className="card">
              <p className="muted">Priority</p>
              <h3>{PRIORITY_LABELS[order.priority]}</h3>
            </article>
          </div>
        </SectionCard>

        <div className="card-stack">
          <AssignUserForm
            orderId={order.id}
            processId={order.currentProcessId}
            currentAssignedUserId={order.currentAssignedUserId}
            referenceData={referenceData}
          />
          <UpdateProcessForm
            orderId={order.id}
            currentProcessId={order.currentProcessId}
            referenceData={referenceData}
          />
        </div>
      </section>

      <section className="detail-grid">
        <SectionCard title="Issues" description="Open and historical issues stay attached to the order and relevant run.">
          <div className="issue-list">
            {order.issues.length === 0 ? (
              <p className="section-copy">No issues recorded.</p>
            ) : (
              order.issues.map((issue) => (
                <article key={issue.id} className="order-card">
                  <div className="split">
                    <strong>{issue.title}</strong>
                    <StatusPill>{issue.status}</StatusPill>
                  </div>
                  <p className="section-copy">{issue.description ?? "No description"}</p>
                  <p className="muted">
                    Process: {issue.process?.name ?? "-"} | Reporter: {issue.createdBy?.name ?? "-"}
                  </p>
                </article>
              ))
            )}
          </div>
        </SectionCard>

        <CreateIssueForm
          orderId={order.id}
          processId={order.currentProcessId}
          referenceData={referenceData}
        />
      </section>

      <SectionCard
        title="Process run history"
        description="Runs are appended chronologically. Rework reasons are shown when the same stage is repeated."
      >
        <div className="history-list">
          {order.processRuns.map((run) => (
            <article key={run.id} className="order-card">
              <div className="split">
                <div>
                  <strong>{run.process.name}</strong>
                  <span className="muted"> pass {run.passNumber}</span>
                </div>
                <StatusPill>{run.status}</StatusPill>
              </div>
              <p className="muted">
                Assignee: {run.assignedUser?.name ?? "Unassigned"} | Started: {formatDate(run.startedAt)} |
                Ended: {formatDate(run.endedAt)}
              </p>
              {run.reworkReason ? (
                <p>
                  <strong>Rework reason:</strong> {run.reworkReason}
                </p>
              ) : null}
              {run.notes ? <p className="section-copy">{run.notes}</p> : null}
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
