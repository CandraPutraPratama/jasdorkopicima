import type { CartItem } from './cart-reducer.ts';

export interface GroupOrderItem {
  id: string;
  participantName: string;
  productName: string;
  variantDescription?: string;
  quantity: number;
  basePrice: number;
  itemPrice: number;
  subtotal: number;
  notes?: string;
  cartItem: CartItem;
  addedAt: string;
}

export interface GroupOrderSession {
  id: string;
  brandSlug: string;
  outletCode: string;
  outletName: string;
  hostName: string;
  hostWa?: string;
  hostToken: string;
  status: 'open' | 'locked' | 'ordered';
  items: GroupOrderItem[];
  orderId?: string;
  createdAt: string;
  expiresAt: string;
}

export interface CreateGroupParams {
  brandSlug?: string;
  outletCode: string;
  outletName?: string;
  hostName: string;
  hostWa?: string;
}

export interface AddItemParams {
  participantName: string;
  cartItem: CartItem | (Omit<CartItem, 'id'> & { id?: string });
}

// ── TYPED ERRORS ──

export class GroupOrderError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code = 'GROUP_ORDER_ERROR', statusCode = 400) {
    super(message);
    this.name = 'GroupOrderError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class GroupOrderNotFoundError extends GroupOrderError {
  constructor(id: string) {
    super(`Sesi pesanan bareng #${id} tidak ditemukan atau sudah kedaluwarsa.`, 'GROUP_NOT_FOUND', 404);
  }
}

export class GroupOrderLockedError extends GroupOrderError {
  constructor() {
    super('Sesi pesanan bareng ini sudah dikunci oleh Host dan tidak menerima menu tambahan.', 'GROUP_LOCKED', 409);
  }
}

export class GroupOrderUnauthorizedError extends GroupOrderError {
  constructor() {
    super('Aksi ditolak: Token host tidak valid.', 'UNAUTHORIZED_HOST', 403);
  }
}

// In-memory storage untuk local dev, unit tests, atau saat KV tidak tersedia
const memoryStorage = new Map<string, GroupOrderSession>();

export function clearGroupOrdersForTesting(): void {
  memoryStorage.clear();
}

/**
 * Menghasilkan kode acak 4-5 karakter untuk URL group order yang mudah dibaca/diketik.
 */
function generateRandomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let res = '';
  for (let i = 0; i < 4; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

function generateHostToken(): string {
  const chars = 'abcdef0123456789';
  let token = '';
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

const KV_PREFIX = 'grp:';
const TTL_SECONDS = 6 * 3600; // 6 jam

async function getKV(): Promise<any | null> {
  try {
    const mod = await import('@opennextjs/cloudflare');
    const context = await mod.getCloudflareContext({ async: true });
    return (context?.env as Record<string, any>)?.RATE_LIMIT_KV || null;
  } catch {
    return null;
  }
}

async function saveSession(session: GroupOrderSession): Promise<void> {
  memoryStorage.set(session.id, session);
  const kv = await getKV();
  if (kv && typeof kv.put === 'function') {
    try {
      await kv.put(KV_PREFIX + session.id, JSON.stringify(session), {
        expirationTtl: TTL_SECONDS,
      });
    } catch {
      // safe fallback ke memoryStorage
    }
  }
}

async function loadSession(id: string): Promise<GroupOrderSession | null> {
  const kv = await getKV();
  if (kv && typeof kv.get === 'function') {
    try {
      const raw = await kv.get(KV_PREFIX + id);
      if (raw) {
        const parsed = JSON.parse(raw) as GroupOrderSession;
        memoryStorage.set(id, parsed);
        return parsed;
      }
    } catch {
      // fallback ke memoryStorage
    }
  }
  return memoryStorage.get(id) || null;
}

/**
 * Membuat sesi group order baru.
 */
export async function createGroupOrderSession(params: CreateGroupParams): Promise<GroupOrderSession> {
  const {
    brandSlug = 'kopi-kenangan',
    outletCode,
    outletName = 'Outlet Pilihan',
    hostName,
    hostWa = '',
  } = params;

  if (!hostName || !hostName.trim()) {
    throw new GroupOrderError('Nama pembuat (Host) wajib diisi.');
  }

  if (!outletCode || !outletCode.trim()) {
    throw new GroupOrderError('Kode outlet wajib diisi.');
  }

  const id = `GRP-${generateRandomCode()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_SECONDS * 1000).toISOString();

  const session: GroupOrderSession = {
    id,
    brandSlug,
    outletCode,
    outletName,
    hostName: hostName.trim(),
    hostWa: hostWa.trim(),
    hostToken: generateHostToken(),
    status: 'open',
    items: [],
    createdAt: now.toISOString(),
    expiresAt,
  };

  await saveSession(session);
  return session;
}

/**
 * Mengambil sesi group order berdasarkan ID.
 */
export async function getGroupOrderSession(groupId: string): Promise<GroupOrderSession | null> {
  if (!groupId) return null;
  const session = await loadSession(groupId.toUpperCase().trim());
  if (!session) return null;

  // Cek kedaluwarsa
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    return null;
  }

  return session;
}

/**
 * Menambahkan menu pilihan peserta ke dalam group order.
 */
export async function addItemToGroupOrder(
  groupId: string,
  params: AddItemParams
): Promise<GroupOrderSession> {
  const session = await getGroupOrderSession(groupId);
  if (!session) {
    throw new GroupOrderNotFoundError(groupId);
  }

  if (session.status !== 'open') {
    throw new GroupOrderLockedError();
  }

  const participantName = params.participantName?.trim();
  if (!participantName) {
    throw new GroupOrderError('Nama pemesan (peserta) wajib diisi.');
  }

  const it = params.cartItem;
  if (!it || !it.name) {
    throw new GroupOrderError('Data minuman tidak valid.');
  }

  const price = (it.basePrice || 0) + (it.variantAddition || 0) + (it.toppingTotal || 0);
  const qty = it.quantity || 1;
  const subtotal = price * qty;

  const resolvedCartItem: CartItem = {
    ...it,
    id: ('id' in it && it.id) ? it.id : `grp-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };

  const newItem: GroupOrderItem = {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    participantName,
    productName: it.name,
    variantDescription: it.variantDescription || '',
    quantity: qty,
    basePrice: it.basePrice || price,
    itemPrice: price,
    subtotal,
    notes: it.notes || '',
    cartItem: resolvedCartItem,
    addedAt: new Date().toISOString(),
  };

  session.items.push(newItem);
  await saveSession(session);
  return session;
}

/**
 * Menghapus salah satu menu dari sesi group order.
 */
export async function removeItemFromGroupOrder(
  groupId: string,
  itemId: string
): Promise<GroupOrderSession> {
  const session = await getGroupOrderSession(groupId);
  if (!session) {
    throw new GroupOrderNotFoundError(groupId);
  }

  if (session.status !== 'open') {
    throw new GroupOrderLockedError();
  }

  session.items = session.items.filter((it) => it.id !== itemId);
  await saveSession(session);
  return session;
}

/**
 * Mengunci sesi group order oleh Host sebelum melakukan pembayaran.
 */
export async function lockGroupOrder(
  groupId: string,
  hostToken: string
): Promise<GroupOrderSession> {
  const session = await getGroupOrderSession(groupId);
  if (!session) {
    throw new GroupOrderNotFoundError(groupId);
  }

  if (!hostToken || hostToken !== session.hostToken) {
    throw new GroupOrderUnauthorizedError();
  }

  session.status = 'locked';
  await saveSession(session);
  return session;
}

/**
 * Membuka kembali kunci sesi group order (jika teman ingin menambah menu lagi).
 */
export async function unlockGroupOrder(
  groupId: string,
  hostToken: string
): Promise<GroupOrderSession> {
  const session = await getGroupOrderSession(groupId);
  if (!session) {
    throw new GroupOrderNotFoundError(groupId);
  }

  if (!hostToken || hostToken !== session.hostToken) {
    throw new GroupOrderUnauthorizedError();
  }

  session.status = 'open';
  await saveSession(session);
  return session;
}

/**
 * Menandai sesi group order telah di-checkout dengan Order ID resmi.
 */
export async function markGroupOrderCompleted(
  groupId: string,
  orderId: string,
  hostToken: string
): Promise<GroupOrderSession> {
  const session = await getGroupOrderSession(groupId);
  if (!session) {
    throw new GroupOrderNotFoundError(groupId);
  }

  if (!hostToken || hostToken !== session.hostToken) {
    throw new GroupOrderUnauthorizedError();
  }

  session.status = 'ordered';
  session.orderId = orderId;
  await saveSession(session);
  return session;
}

/**
 * Mengonversi seluruh GroupOrderItem menjadi CartItem standar untuk checkout Jasdor,
 * dengan nama masing-masing peserta otomatis disematkan pada catatan item.
 */
export function convertGroupItemsToCartItems(items: GroupOrderItem[]): CartItem[] {
  return items.map((gItem, idx) => {
    const raw = gItem.cartItem;
    const existingNotes = raw.notes ? ` - ${raw.notes}` : '';
    const groupNote = `[${gItem.participantName}]${existingNotes}`;

    return {
      ...raw,
      id: `${raw.id || 'grp'}-${idx + 1}-${Date.now().toString(36)}`,
      quantity: gItem.quantity || 1,
      notes: groupNote,
    };
  });
}
