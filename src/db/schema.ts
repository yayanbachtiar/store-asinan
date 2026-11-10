import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Skema database aplikasi asinan — sesuai Bagian 5 breakdown v1.1.
 * Semua uang dalam Rupiah bulat (integer), tanpa desimal.
 * Prinsip inti: status BAYAR (orders.payment_status / payments) terpisah
 * dari status SETOR (settlements) — uang bisa sudah dibayar pelanggan
 * tapi masih di tangan anggota, belum sampai ke bendahara.
 */

export const memberRoleEnum = pgEnum("member_role", ["bendahara", "anggota"]);
export const batchStatusEnum = pgEnum("batch_status", ["aktif", "ditutup"]);
export const paymentStatusEnum = pgEnum("payment_status", ["belum", "sudah"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "transfer"]);
export const settlementStatusEnum = pgEnum("settlement_status", ["menunggu", "diterima"]);
export const advanceStatusEnum = pgEnum("advance_status", ["belum_diganti", "diganti"]);
export const allocationKindEnum = pgEnum("allocation_kind", ["ditahan", "diputar", "dibagi"]);
export const createdViaEnum = pgEnum("created_via", ["dashboard", "telegram"]);
export const orderSourceEnum = pgEnum("order_source", ["wa", "langsung", "puskesmas"]);

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  telegramId: text("telegram_id").unique(),
  role: memberRoleEnum("role").notNull().default("anggota"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt,
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  note: text("note"),
  createdBy: integer("created_by").references(() => members.id),
  createdAt,
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  price: integer("price").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt,
});

export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD (tanggal produksi)
  title: text("title"),
  status: batchStatusEnum("status").notNull().default("aktif"),
  initialCapital: integer("initial_capital").notNull().default(0),
  createdBy: integer("created_by").references(() => members.id),
  createdAt,
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  paidBy: integer("paid_by")
    .notNull()
    .references(() => members.id),
  createdVia: createdViaEnum("created_via").notNull().default("dashboard"),
  createdAt,
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  recordedBy: integer("recorded_by")
    .notNull()
    .references(() => members.id),
  source: orderSourceEnum("source").notNull().default("wa"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("belum"),
  createdVia: createdViaEnum("created_via").notNull().default("dashboard"),
  createdAt,
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  // Snapshot: nama & harga saat order dibuat — perubahan harga produk
  // di masa depan tidak boleh mengubah laporan lama.
  productNameSnapshot: text("product_name_snapshot").notNull(),
  priceSnapshot: integer("price_snapshot").notNull(),
  qty: integer("qty").notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  method: paymentMethodEnum("method").notNull(),
  receivedBy: integer("received_by")
    .notNull()
    .references(() => members.id),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt,
});

export const settlements = pgTable("settlements", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id")
    .notNull()
    .references(() => members.id),
  receivedBy: integer("received_by")
    .notNull()
    .references(() => members.id), // bendahara penerima setoran
  amount: integer("amount").notNull(),
  status: settlementStatusEnum("status").notNull().default("menunggu"),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  createdAt,
});

export const advances = pgTable("advances", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  memberId: integer("member_id")
    .notNull()
    .references(() => members.id),
  amount: integer("amount").notNull(),
  status: advanceStatusEnum("status").notNull().default("belum_diganti"),
  createdAt,
});

export const profitAllocations = pgTable("profit_allocations", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  kind: allocationKindEnum("kind").notNull(),
  memberId: integer("member_id").references(() => members.id), // terisi bila kind='dibagi'
  amount: integer("amount").notNull(),
  note: text("note"),
  decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt,
});

export const aiUsage = pgTable("ai_usage", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id),
  kind: text("kind").notNull(), // parse_order | parse_expense | tanya
  createdAt,
});

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  detail: jsonb("detail"),
  createdAt,
});
