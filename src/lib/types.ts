/**
 * Tipe domain aplikasi — mencerminkan dokumen Firestore (1 dokumen = 1 baris
 * di model lama). ID selalu string (ID dokumen Firestore).
 * Semua uang integer Rupiah. Tanggal disimpan sebagai string ISO:
 * tanggal batch "YYYY-MM-DD", timestamp lengkap ISO 8601.
 */

export type MemberRole = "bendahara" | "anggota";
export type BatchStatus = "aktif" | "ditutup";
export type PaymentStatus = "belum" | "sudah";
export type PaymentMethod = "cash" | "transfer";
export type SettlementStatus = "menunggu" | "diterima";
export type AdvanceStatus = "belum_diganti" | "diganti";
export type AllocationKind = "ditahan" | "diputar" | "dibagi";
export type CreatedVia = "dashboard" | "telegram";
export type OrderSource = "wa" | "langsung" | "puskesmas";

export type Member = {
  id: string;
  name: string;
  email: string;
  telegramId: string | null;
  role: MemberRole;
  isActive: boolean;
  createdAt: string;
};

export type Customer = {
  id: string;
  name: string;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  createdAt: string;
};

export type Batch = {
  id: string;
  /** Tanggal produksi, YYYY-MM-DD. */
  date: string;
  title: string | null;
  status: BatchStatus;
  initialCapital: number;
  createdBy: string | null;
  createdAt: string;
};

export type Expense = {
  id: string;
  batchId: string;
  description: string;
  amount: number;
  paidBy: string;
  createdVia: CreatedVia;
  createdAt: string;
};

/**
 * Item order TERTANAM (embedded array) di dokumen orders — bukan collection
 * terpisah. Harga & nama adalah snapshot saat order dibuat: perubahan harga
 * produk di masa depan tidak mengubah laporan lama.
 */
export type OrderItem = {
  productId: string | null;
  productNameSnapshot: string;
  priceSnapshot: number;
  qty: number;
};

export type Order = {
  id: string;
  batchId: string;
  customerId: string;
  recordedBy: string;
  source: OrderSource;
  paymentStatus: PaymentStatus;
  createdVia: CreatedVia;
  items: OrderItem[];
  createdAt: string;
};

export type Payment = {
  id: string;
  orderId: string;
  /** Denormalisasi dari orders.batchId agar query pembayaran per batch praktis. */
  batchId: string;
  amount: number;
  method: PaymentMethod;
  receivedBy: string;
  /** ISO timestamp pembayaran dicatat. */
  paidAt: string;
  createdAt: string;
};

export type Settlement = {
  id: string;
  memberId: string;
  /** Bendahara penerima setoran. */
  receivedBy: string;
  amount: number;
  status: SettlementStatus;
  settledAt: string | null;
  createdAt: string;
};

export type Advance = {
  id: string;
  batchId: string;
  memberId: string;
  amount: number;
  status: AdvanceStatus;
  createdAt: string;
};

export type ProfitAllocation = {
  id: string;
  batchId: string;
  kind: AllocationKind;
  /** Terisi bila kind = "dibagi". */
  memberId: string | null;
  amount: number;
  note: string | null;
  decidedAt: string;
  createdAt: string;
};
