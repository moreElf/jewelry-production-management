import {
  IssueStatus,
  OrderStatus,
  PrismaClient,
  Priority,
  ProcessRunStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const processSeeds = [
  { code: "ORDER", name: "受注", sortOrder: 1, allowMultiplePasses: false },
  { code: "CAD", name: "原型 / CAD", sortOrder: 2, allowMultiplePasses: false },
  { code: "MOLD", name: "型", sortOrder: 3, allowMultiplePasses: false },
  { code: "CASTING", name: "キャスト", sortOrder: 4, allowMultiplePasses: false },
  { code: "POLISHING", name: "研磨", sortOrder: 5, allowMultiplePasses: true },
  { code: "STONE_SETTING", name: "石留め", sortOrder: 6, allowMultiplePasses: false },
  { code: "INSPECTION", name: "検品", sortOrder: 7, allowMultiplePasses: false },
  { code: "DELIVERY", name: "納品", sortOrder: 8, allowMultiplePasses: false },
];

async function main() {
  await prisma.$transaction([
    prisma.issue.deleteMany(),
    prisma.orderHistoryLog.deleteMany(),
    prisma.orderAssignment.deleteMany(),
    prisma.processTransition.deleteMany(),
    prisma.processRun.deleteMany(),
    prisma.productionOrder.deleteMany(),
    prisma.productProcessTemplate.deleteMany(),
    prisma.processMaster.deleteMany(),
    prisma.product.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Tanaka",
        email: "tanaka@example.com",
        role: "Production Manager",
        specialization: "Planning",
      },
    }),
    prisma.user.create({
      data: {
        name: "Sato",
        email: "sato@example.com",
        role: "Craftsperson",
        specialization: "CAD",
      },
    }),
    prisma.user.create({
      data: {
        name: "Suzuki",
        email: "suzuki@example.com",
        role: "Craftsperson",
        specialization: "Polishing",
      },
    }),
    prisma.user.create({
      data: {
        name: "Kobayashi",
        email: "kobayashi@example.com",
        role: "Craftsperson",
        specialization: "Stone Setting",
      },
    }),
  ]);

  const processMap = new Map<string, string>();

  for (const process of processSeeds) {
    const record = await prisma.processMaster.create({ data: process });
    processMap.set(process.code, record.id);
  }

  for (let index = 0; index < processSeeds.length - 1; index += 1) {
    const current = processSeeds[index];
    const next = processSeeds[index + 1];

    await prisma.processTransition.create({
      data: {
        fromProcessId: processMap.get(current.code)!,
        toProcessId: processMap.get(next.code)!,
      },
    });
  }

  await prisma.processTransition.create({
    data: {
      fromProcessId: processMap.get("INSPECTION")!,
      toProcessId: processMap.get("POLISHING")!,
      isReworkPath: true,
      reasonLabel: "Inspection rework",
    },
  });

  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Classic Signet Ring",
        sku: "RING-001",
        material: "Silver 925",
        finishType: "Mirror",
      },
    }),
    prisma.product.create({
      data: {
        name: "Pave Stone Pendant",
        sku: "NECK-014",
        material: "K10 Yellow Gold",
        stoneType: "Diamond",
        finishType: "Polished",
      },
    }),
    prisma.product.create({
      data: {
        name: "Slim Hoop Pierce",
        sku: "PIERCE-008",
        material: "Brass",
        platingType: "Gold Plating",
      },
    }),
  ]);

  for (const product of products) {
    for (const process of processSeeds) {
      await prisma.productProcessTemplate.create({
        data: {
          productId: product.id,
          processId: processMap.get(process.code)!,
          sortOrder: process.sortOrder,
          defaultAssigneeId:
            process.code === "CAD"
              ? users[1].id
              : process.code === "POLISHING"
                ? users[2].id
                : process.code === "STONE_SETTING"
                  ? users[3].id
                  : users[0].id,
        },
      });
    }
  }

  const polishingOrder = await prisma.productionOrder.create({
    data: {
      orderNumber: "PO-2026-001",
      title: "Pendant batch with polishing rework",
      productId: products[1].id,
      quantity: 12,
      dueDate: new Date("2026-03-14"),
      priority: Priority.HIGH,
      status: OrderStatus.IN_PROGRESS,
      notes: "Inspection returned 2 pieces for additional polishing.",
      currentProcessId: processMap.get("POLISHING"),
      currentAssignedUserId: users[2].id,
      startedAt: new Date("2026-03-01"),
    },
  });

  await prisma.processRun.createMany({
    data: [
      {
        productionOrderId: polishingOrder.id,
        processId: processMap.get("ORDER")!,
        assignedUserId: users[0].id,
        passNumber: 1,
        status: ProcessRunStatus.COMPLETED,
        startedAt: new Date("2026-03-01"),
        endedAt: new Date("2026-03-01"),
      },
      {
        productionOrderId: polishingOrder.id,
        processId: processMap.get("CAD")!,
        assignedUserId: users[1].id,
        passNumber: 1,
        status: ProcessRunStatus.COMPLETED,
        startedAt: new Date("2026-03-02"),
        endedAt: new Date("2026-03-02"),
      },
      {
        productionOrderId: polishingOrder.id,
        processId: processMap.get("MOLD")!,
        assignedUserId: users[0].id,
        passNumber: 1,
        status: ProcessRunStatus.COMPLETED,
        startedAt: new Date("2026-03-03"),
        endedAt: new Date("2026-03-03"),
      },
      {
        productionOrderId: polishingOrder.id,
        processId: processMap.get("CASTING")!,
        assignedUserId: users[0].id,
        passNumber: 1,
        status: ProcessRunStatus.COMPLETED,
        startedAt: new Date("2026-03-04"),
        endedAt: new Date("2026-03-04"),
      },
      {
        productionOrderId: polishingOrder.id,
        processId: processMap.get("POLISHING")!,
        assignedUserId: users[2].id,
        passNumber: 1,
        status: ProcessRunStatus.COMPLETED,
        startedAt: new Date("2026-03-05"),
        endedAt: new Date("2026-03-06"),
      },
      {
        productionOrderId: polishingOrder.id,
        processId: processMap.get("STONE_SETTING")!,
        assignedUserId: users[3].id,
        passNumber: 1,
        status: ProcessRunStatus.COMPLETED,
        startedAt: new Date("2026-03-06"),
        endedAt: new Date("2026-03-07"),
      },
      {
        productionOrderId: polishingOrder.id,
        processId: processMap.get("INSPECTION")!,
        assignedUserId: users[0].id,
        passNumber: 1,
        status: ProcessRunStatus.REWORK,
        startedAt: new Date("2026-03-07"),
        endedAt: new Date("2026-03-07"),
        reworkReason: "Minor surface scratches found after stone setting.",
      },
      {
        productionOrderId: polishingOrder.id,
        processId: processMap.get("POLISHING")!,
        assignedUserId: users[2].id,
        passNumber: 2,
        status: ProcessRunStatus.WORKING,
        startedAt: new Date("2026-03-08"),
        reworkReason: "Returned from inspection for final surface adjustment.",
        notes: "Second polishing pass in progress.",
      },
    ],
  });

  await prisma.orderHistoryLog.createMany({
    data: [
      {
        productionOrderId: polishingOrder.id,
        toProcessId: processMap.get("ORDER")!,
        changedById: users[0].id,
        action: "ORDER_CREATED",
      },
      {
        productionOrderId: polishingOrder.id,
        fromProcessId: processMap.get("INSPECTION")!,
        toProcessId: processMap.get("POLISHING")!,
        changedById: users[0].id,
        action: "PROCESS_UPDATED",
        reason: "Minor surface scratches found after stone setting.",
      },
    ],
  });

  await prisma.issue.create({
    data: {
      productionOrderId: polishingOrder.id,
      processId: processMap.get("INSPECTION")!,
      createdById: users[0].id,
      title: "Inspection found surface scratches",
      description: "Two pendants require another polishing pass before delivery.",
      status: IssueStatus.OPEN,
      occurredAt: new Date("2026-03-07"),
    },
  });

  const activeOrder = await prisma.productionOrder.create({
    data: {
      orderNumber: "PO-2026-002",
      title: "Ring order in casting",
      productId: products[0].id,
      quantity: 8,
      dueDate: new Date("2026-03-12"),
      priority: Priority.MEDIUM,
      status: OrderStatus.IN_PROGRESS,
      currentProcessId: processMap.get("CASTING"),
      currentAssignedUserId: users[0].id,
      startedAt: new Date("2026-03-02"),
    },
  });

  await prisma.processRun.createMany({
    data: [
      {
        productionOrderId: activeOrder.id,
        processId: processMap.get("ORDER")!,
        assignedUserId: users[0].id,
        passNumber: 1,
        status: ProcessRunStatus.COMPLETED,
        startedAt: new Date("2026-03-02"),
        endedAt: new Date("2026-03-02"),
      },
      {
        productionOrderId: activeOrder.id,
        processId: processMap.get("CAD")!,
        assignedUserId: users[1].id,
        passNumber: 1,
        status: ProcessRunStatus.COMPLETED,
        startedAt: new Date("2026-03-03"),
        endedAt: new Date("2026-03-03"),
      },
      {
        productionOrderId: activeOrder.id,
        processId: processMap.get("MOLD")!,
        assignedUserId: users[0].id,
        passNumber: 1,
        status: ProcessRunStatus.COMPLETED,
        startedAt: new Date("2026-03-04"),
        endedAt: new Date("2026-03-04"),
      },
      {
        productionOrderId: activeOrder.id,
        processId: processMap.get("CASTING")!,
        assignedUserId: users[0].id,
        passNumber: 1,
        status: ProcessRunStatus.WORKING,
        startedAt: new Date("2026-03-05"),
      },
    ],
  });

  const delayedOrder = await prisma.productionOrder.create({
    data: {
      orderNumber: "PO-2026-003",
      title: "Pierce order delayed in stone setting",
      productId: products[2].id,
      quantity: 20,
      dueDate: new Date("2026-03-05"),
      priority: Priority.URGENT,
      status: OrderStatus.BLOCKED,
      currentProcessId: processMap.get("STONE_SETTING"),
      currentAssignedUserId: users[3].id,
      startedAt: new Date("2026-02-27"),
      notes: "Stone size mismatch with provided lot.",
    },
  });

  await prisma.processRun.createMany({
    data: [
      {
        productionOrderId: delayedOrder.id,
        processId: processMap.get("ORDER")!,
        assignedUserId: users[0].id,
        passNumber: 1,
        status: ProcessRunStatus.COMPLETED,
        startedAt: new Date("2026-02-27"),
        endedAt: new Date("2026-02-27"),
      },
      {
        productionOrderId: delayedOrder.id,
        processId: processMap.get("CAD")!,
        assignedUserId: users[1].id,
        passNumber: 1,
        status: ProcessRunStatus.COMPLETED,
        startedAt: new Date("2026-02-28"),
        endedAt: new Date("2026-02-28"),
      },
      {
        productionOrderId: delayedOrder.id,
        processId: processMap.get("MOLD")!,
        assignedUserId: users[0].id,
        passNumber: 1,
        status: ProcessRunStatus.COMPLETED,
        startedAt: new Date("2026-03-01"),
        endedAt: new Date("2026-03-01"),
      },
      {
        productionOrderId: delayedOrder.id,
        processId: processMap.get("CASTING")!,
        assignedUserId: users[0].id,
        passNumber: 1,
        status: ProcessRunStatus.COMPLETED,
        startedAt: new Date("2026-03-02"),
        endedAt: new Date("2026-03-02"),
      },
      {
        productionOrderId: delayedOrder.id,
        processId: processMap.get("POLISHING")!,
        assignedUserId: users[2].id,
        passNumber: 1,
        status: ProcessRunStatus.COMPLETED,
        startedAt: new Date("2026-03-03"),
        endedAt: new Date("2026-03-03"),
      },
      {
        productionOrderId: delayedOrder.id,
        processId: processMap.get("STONE_SETTING")!,
        assignedUserId: users[3].id,
        passNumber: 1,
        status: ProcessRunStatus.BLOCKED,
        startedAt: new Date("2026-03-04"),
        notes: "Awaiting corrected stone dimensions.",
      },
    ],
  });

  await prisma.issue.create({
    data: {
      productionOrderId: delayedOrder.id,
      processId: processMap.get("STONE_SETTING")!,
      createdById: users[3].id,
      title: "Stone size mismatch",
      description: "Provided stones do not fit current setting tolerance.",
      status: IssueStatus.IN_PROGRESS,
      occurredAt: new Date("2026-03-04"),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
