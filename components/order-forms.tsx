import { OrderStatus, Priority } from "@prisma/client";

import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { createIssue, createProductionOrder, assignUser, updateCurrentProcess } from "@/app/orders/actions";
import type { ReferenceData } from "@/lib/data";

export function CreateOrderForm({ referenceData }: { referenceData: ReferenceData }) {
  return (
    <form action={createProductionOrder} className="card">
      <div className="split">
        <div>
          <h2>Create production order</h2>
          <p className="section-copy">Start new jobs from the standard workflow and preserve process history from day one.</p>
        </div>
      </div>
      <div className="form-grid">
        <label className="field">
          <span>Order number</span>
          <input className="input mono" name="orderNumber" placeholder="PO-2026-010" required />
        </label>
        <label className="field">
          <span>Product</span>
          <select className="select" name="productId" required defaultValue="">
            <option value="" disabled>
              Select a product
            </option>
            {referenceData.products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Quantity</span>
          <input className="input" name="quantity" type="number" min="1" defaultValue="1" required />
        </label>
        <label className="field">
          <span>Due date</span>
          <input className="input" name="dueDate" type="date" />
        </label>
        <label className="field">
          <span>Priority</span>
          <select className="select" name="priority" defaultValue={Priority.MEDIUM}>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field-stack">
          <span>Notes</span>
          <textarea className="textarea" name="notes" placeholder="Optional production notes" />
        </label>
      </div>
      <button className="button" type="submit">
        Create order
      </button>
    </form>
  );
}

export function OrderFilters({
  referenceData,
  searchParams,
}: {
  referenceData: ReferenceData;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const status = typeof searchParams.status === "string" ? searchParams.status : "";
  const processId = typeof searchParams.processId === "string" ? searchParams.processId : "";
  const assigneeId = typeof searchParams.assigneeId === "string" ? searchParams.assigneeId : "";

  return (
    <form className="card">
      <div className="split">
        <div>
          <h2>Filters</h2>
          <p className="section-copy">Keep the list focused by order status, current process, or assignee.</p>
        </div>
        <button className="button secondary" type="submit">
          Apply
        </button>
      </div>
      <div className="form-grid">
        <label className="field">
          <span>Status</span>
          <select className="select" name="status" defaultValue={status}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Current process</span>
          <select className="select" name="processId" defaultValue={processId}>
            <option value="">All processes</option>
            {referenceData.processes.map((process) => (
              <option key={process.id} value={process.id}>
                {process.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Assignee</span>
          <select className="select" name="assigneeId" defaultValue={assigneeId}>
            <option value="">All assignees</option>
            {referenceData.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </form>
  );
}

export function AssignUserForm({
  orderId,
  processId,
  currentAssignedUserId,
  referenceData,
}: {
  orderId: string;
  processId: string | null;
  currentAssignedUserId: string | null;
  referenceData: ReferenceData;
}) {
  return (
    <form action={assignUser} className="card">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="processId" value={processId ?? ""} />
      <h3>Assign user</h3>
      <div className="field">
        <span>Current assignee</span>
        <select className="select" name="userId" defaultValue={currentAssignedUserId ?? ""}>
          <option value="">Unassigned</option>
          {referenceData.users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
      <button className="button" type="submit">
        Save assignment
      </button>
    </form>
  );
}

export function UpdateProcessForm({
  orderId,
  currentProcessId,
  referenceData,
}: {
  orderId: string;
  currentProcessId: string | null;
  referenceData: ReferenceData;
}) {
  return (
    <form action={updateCurrentProcess} className="card">
      <input type="hidden" name="orderId" value={orderId} />
      <h3>Update current process</h3>
      <div className="form-grid">
        <label className="field">
          <span>Next process</span>
          <select className="select" name="processId" defaultValue={currentProcessId ?? ""} required>
            {referenceData.processes.map((process) => (
              <option key={process.id} value={process.id}>
                {process.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Rework reason</span>
          <input className="input" name="reworkReason" placeholder="Required when rolling back or repeating a stage" />
        </label>
        <label className="field-stack">
          <span>Note</span>
          <textarea className="textarea" name="note" placeholder="Optional context for the process move" />
        </label>
      </div>
      <button className="button" type="submit">
        Append process run
      </button>
    </form>
  );
}

export function CreateIssueForm({
  orderId,
  processId,
  referenceData,
}: {
  orderId: string;
  processId: string | null;
  referenceData: ReferenceData;
}) {
  return (
    <form action={createIssue} className="card">
      <input type="hidden" name="orderId" value={orderId} />
      <h3>Create issue</h3>
      <div className="form-grid">
        <label className="field">
          <span>Title</span>
          <input className="input" name="title" placeholder="Surface scratch after inspection" required />
        </label>
        <label className="field">
          <span>Process</span>
          <select className="select" name="processId" defaultValue={processId ?? ""}>
            <option value="">Not tied to a specific process</option>
            {referenceData.processes.map((process) => (
              <option key={process.id} value={process.id}>
                {process.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Reported by</span>
          <select className="select" name="createdById" defaultValue="">
            <option value="">Unknown</option>
            {referenceData.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field-stack">
          <span>Description</span>
          <textarea className="textarea" name="description" placeholder="Why this blocks delivery or causes rework" />
        </label>
      </div>
      <button className="button" type="submit">
        Add issue
      </button>
    </form>
  );
}

export const statusOptions = Object.values(OrderStatus);
