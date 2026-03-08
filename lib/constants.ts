import { OrderStatus, Priority } from "@prisma/client";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/orders", label: "Production Orders" },
  { href: "/board", label: "Process Board" },
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Draft",
  READY: "Ready",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const DEFAULT_STAGE_CODES = [
  "ORDER",
  "CAD",
  "MOLD",
  "CASTING",
  "POLISHING",
  "STONE_SETTING",
  "INSPECTION",
  "DELIVERY",
] as const;
