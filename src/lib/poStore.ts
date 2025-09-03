// src/lib/poStore.ts
export type Role = 'employee' | 'supervisor' | 'procurement';

export type Item = {
  no: number;
  description: string;
  receivedDate: string;
  quantity: string; // เก็บตามที่พิมพ์ (แปลงเลขตอนคำนวณ)
  amount: string;   // เก็บตามที่พิมพ์
};

export type Order = {
  id: number;
  orderNo: string;
  date: string;
  requester: string;
  department: string;
  items: Item[];
  totalAmount: number;
  purpose: string;
  supervisor: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'delivered';
  createdAt: string;
  tracking: {
    requestedBy: string;
    supervisorApproval: null | {
      approved: boolean;
      at: string;
      by?: string;
      reason?: string;
    };
    procurementSteps: {
      received: boolean;
      ordered: boolean;
      checking: boolean;
      shipped: boolean;
      delivered: boolean;
    };
  };
};

export type Notification = {
  id: number;
  type:
    | 'new_request'
    | 'status_update'
    | 'approval'
    | 'rejection'
    | 'progress';
  title: string;
  message: string;
  targetRole: Role | 'all';
  createdAt: string;
  read?: boolean;
  orderId?: number;
  orderNo?: string;
  fromRole?: Role;
};

export type State = {
  orders: Order[];
  notifications: Notification[];
};

const STATE_KEY = 'po_state_v1';
const ROLE_KEY = 'po_current_role';

function initState(): State {
  return { orders: [], notifications: [] };
}

export function getState(): State {
  if (typeof window === 'undefined') return initState();
  const raw = localStorage.getItem(STATE_KEY);
  if (!raw) {
    const s = initState();
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
    return s;
  }
  try {
    return JSON.parse(raw) as State;
  } catch {
    const s = initState();
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
    return s;
  }
}

export function setState(s: State) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STATE_KEY, JSON.stringify(s));
  // แจ้งให้แท็บอื่นอัปเดต
  try {
    window.dispatchEvent(new StorageEvent('storage', { key: STATE_KEY }));
  } catch {}
}

export function getRole(): Role {
  if (typeof window === 'undefined') return 'employee';
  return (localStorage.getItem(ROLE_KEY) as Role) || 'employee';
}
export function setRole(r: Role) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROLE_KEY, r);
}

export function unreadForRole(role: Role): number {
  const s = getState();
  return s.notifications.filter(
    (n) => !n.read && (n.targetRole === role || n.targetRole === 'all')
  ).length;
}

export function createNotification(n: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
  const s = getState();
  const note: Notification = {
    ...n,
    id: Date.now(),
    createdAt: new Date().toISOString(),
    read: false,
  };
  s.notifications.unshift(note);
  setState(s);
}
