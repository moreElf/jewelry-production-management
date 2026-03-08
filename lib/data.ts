import { IssueStatus, OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const activeStatuses: OrderStatus[] = [
  OrderStatus.READY,
  OrderStatus.IN_PROGRESS,
  OrderStatus.BLOCKED,
];

function isDatabaseUnavailable(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("Cannot fetch data from service") ||
    error.message.includes("fetch failed") ||
    error.message.includes("Can't reach database server") ||
    error.message.includes("P1001")
  );
}

function logDatabaseError(scope: string, error: unknown) {
  console.error(`[database:${scope}]`, error);
}

export async function getReferenceData() {
  try {
    const [users, processes, products] = await Promise.all([
      prisma.user.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.processMaster.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return { users, processes, products, databaseUnavailable: false };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error;
    }

    logDatabaseError("reference", error);

    return {
      users: [],
      processes: [],
      products: [],
      databaseUnavailable: true,
    };
  }
}

export type ReferenceData = Awaited<ReturnType<typeof getReferenceData>>;

export async function getDashboardData() {
  const now = new Date();

  try {
    const [activeOrders, delayedOrders, polishingOrders, openIssueOrders, processCounts] =
      await Promise.all([
        prisma.productionOrder.count({
          where: { status: { in: activeStatuses } },
        }),
        prisma.productionOrder.count({
          where: {
            status: { in: activeStatuses },
            dueDate: { lt: now },
          },
        }),
        prisma.productionOrder.count({
          where: {
            status: { in: activeStatuses },
            currentProcess: { code: "POLISHING" },
          },
        }),
        prisma.productionOrder.count({
          where: {
            issues: {
              some: {
                status: { in: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS] },
              },
            },
          },
        }),
        prisma.processMaster.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            _count: {
              select: {
                currentOrders: {
                  where: {
                    status: { in: activeStatuses },
                  },
                },
              },
            },
          },
        }),
      ]);

    return {
      activeOrders,
      delayedOrders,
      polishingOrders,
      openIssueOrders,
      processCounts: processCounts.map((process) => ({
        id: process.id,
        code: process.code,
        name: process.name,
        count: process._count.currentOrders,
      })),
      databaseUnavailable: false,
    };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error;
    }

    logDatabaseError("dashboard", error);

    return {
      activeOrders: 0,
      delayedOrders: 0,
      polishingOrders: 0,
      openIssueOrders: 0,
      processCounts: [],
      databaseUnavailable: true,
    };
  }
}

export type OrdersFilter = {
  status?: string;
  processId?: string;
  assigneeId?: string;
};

export async function getOrders(filters: OrdersFilter) {
  const where: Prisma.ProductionOrderWhereInput = {
    ...(filters.status ? { status: filters.status as OrderStatus } : {}),
    ...(filters.processId ? { currentProcessId: filters.processId } : {}),
    ...(filters.assigneeId ? { currentAssignedUserId: filters.assigneeId } : {}),
  };

  try {
    const orders = await prisma.productionOrder.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { orderNumber: "asc" }],
      include: {
        product: true,
        currentProcess: true,
        currentAssignedUser: true,
        issues: {
          where: {
            status: {
              in: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS],
            },
          },
        },
      },
    });

    return { orders, databaseUnavailable: false };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error;
    }

    logDatabaseError("orders", error);

    return { orders: [], databaseUnavailable: true };
  }
}

export async function getBoardData() {
  try {
    const columns = await prisma.processMaster.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        currentOrders: {
          where: {
            status: { not: OrderStatus.CANCELLED },
          },
          orderBy: [{ dueDate: "asc" }, { orderNumber: "asc" }],
          include: {
            product: true,
            currentAssignedUser: true,
          },
        },
      },
    });

    return { columns, databaseUnavailable: false };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error;
    }

    logDatabaseError("board", error);

    return { columns: [], databaseUnavailable: true };
  }
}

export async function getOrderDetail(orderId: string) {
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        currentProcess: true,
        currentAssignedUser: true,
        issues: {
          orderBy: [{ status: "asc" }, { createdAt: "asc" }],
          include: {
            process: true,
            processRun: true,
            createdBy: true,
          },
        },
        processRuns: {
          orderBy: [{ createdAt: "asc" }, { passNumber: "asc" }],
          include: {
            process: true,
            assignedUser: true,
          },
        },
        historyLogs: {
          orderBy: { createdAt: "asc" },
          include: {
            fromProcess: true,
            toProcess: true,
            changedBy: true,
          },
        },
      },
    });

    return { order, databaseUnavailable: false };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error;
    }

    logDatabaseError("order-detail", error);

    return { order: null, databaseUnavailable: true };
  }
}
