"use server";

import { OrderStatus, ProcessRunStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

function normalizeOptional(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createProductionOrder(formData: FormData) {
  const productId = String(formData.get("productId"));
  const orderNumber = String(formData.get("orderNumber"));
  const quantity = Number(formData.get("quantity"));
  const dueDate = normalizeOptional(formData.get("dueDate"));
  const priority = String(formData.get("priority")) as
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "URGENT";
  const notes = normalizeOptional(formData.get("notes"));

  const firstProcess = await prisma.processMaster.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  if (!firstProcess) {
    throw new Error("No process master data found.");
  }

  const order = await prisma.productionOrder.create({
    data: {
      orderNumber,
      productId,
      quantity,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority,
      notes,
      status: OrderStatus.READY,
      currentProcessId: firstProcess.id,
      processRuns: {
        create: {
          processId: firstProcess.id,
          passNumber: 1,
          status: ProcessRunStatus.WORKING,
          startedAt: new Date(),
        },
      },
      historyLogs: {
        create: {
          toProcessId: firstProcess.id,
          action: "ORDER_CREATED",
          note: "Initial process run created.",
        },
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/board");
  redirect(`/orders/${order.id}`);
}

export async function assignUser(formData: FormData) {
  const orderId = String(formData.get("orderId"));
  const userId = normalizeOptional(formData.get("userId"));
  const processId = normalizeOptional(formData.get("processId"));

  await prisma.$transaction(async (tx) => {
    await tx.productionOrder.update({
      where: { id: orderId },
      data: {
        currentAssignedUserId: userId,
      },
    });

    if (userId) {
      await tx.orderAssignment.create({
        data: {
          productionOrderId: orderId,
          userId,
          processId,
          notes: "Assigned from order detail view.",
        },
      });
    }

    const currentRun = await tx.processRun.findFirst({
      where: { productionOrderId: orderId },
      orderBy: [{ createdAt: "desc" }, { passNumber: "desc" }],
    });

    if (currentRun) {
      await tx.processRun.update({
        where: { id: currentRun.id },
        data: { assignedUserId: userId },
      });
    }
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/board");
}

export async function updateCurrentProcess(formData: FormData) {
  const orderId = String(formData.get("orderId"));
  const nextProcessId = String(formData.get("processId"));
  const reworkReason = normalizeOptional(formData.get("reworkReason"));
  const note = normalizeOptional(formData.get("note"));

  await prisma.$transaction(async (tx) => {
    const order = await tx.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        currentProcess: true,
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    const [nextProcess, latestRun] = await Promise.all([
      tx.processMaster.findUnique({
        where: { id: nextProcessId },
      }),
      tx.processRun.findFirst({
        where: { productionOrderId: orderId },
        orderBy: [{ createdAt: "desc" }, { passNumber: "desc" }],
      }),
    ]);

    if (!nextProcess) {
      throw new Error("Target process not found.");
    }

    if (latestRun && !latestRun.endedAt) {
      await tx.processRun.update({
        where: { id: latestRun.id },
        data: {
          endedAt: new Date(),
          status:
            order.currentProcessId === nextProcessId
              ? ProcessRunStatus.REWORK
              : ProcessRunStatus.COMPLETED,
        },
      });
    }

    const existingPasses = await tx.processRun.count({
      where: {
        productionOrderId: orderId,
        processId: nextProcessId,
      },
    });

    const passNumber = existingPasses + 1;

    await tx.processRun.create({
      data: {
        productionOrderId: orderId,
        processId: nextProcessId,
        assignedUserId: order.currentAssignedUserId,
        passNumber,
        startedAt: new Date(),
        status: ProcessRunStatus.WORKING,
        reworkReason,
        notes: note,
      },
    });

    await tx.productionOrder.update({
      where: { id: orderId },
      data: {
        currentProcessId: nextProcessId,
        status:
          nextProcess.code === "DELIVERY"
            ? OrderStatus.COMPLETED
            : OrderStatus.IN_PROGRESS,
        completedAt: nextProcess.code === "DELIVERY" ? new Date() : null,
      },
    });

    await tx.orderHistoryLog.create({
      data: {
        productionOrderId: orderId,
        fromProcessId: order.currentProcessId,
        toProcessId: nextProcessId,
        action: "PROCESS_UPDATED",
        reason: reworkReason,
        note,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/board");
}

export async function createIssue(formData: FormData) {
  const orderId = String(formData.get("orderId"));
  const title = String(formData.get("title"));
  const description = normalizeOptional(formData.get("description"));
  const processId = normalizeOptional(formData.get("processId"));
  const createdById = normalizeOptional(formData.get("createdById"));

  const latestRun = await prisma.processRun.findFirst({
    where: {
      productionOrderId: orderId,
      ...(processId ? { processId } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { passNumber: "desc" }],
  });

  await prisma.issue.create({
    data: {
      productionOrderId: orderId,
      processId,
      processRunId: latestRun?.id,
      createdById,
      title,
      description,
    },
  });

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}
