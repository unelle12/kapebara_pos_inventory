"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

/* ------------------------------------------------------------------
 * Cart line shape — denormalized snapshot at add-time so price/name
 * don't drift if the product is edited mid-sale.
 * ------------------------------------------------------------------ */
export type CartLine = {
  /** Unique key for the line: variantId if present, otherwise productId. */
  lineId: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string;
  unitPrice: number;
  qty: number;
  trackStock: boolean;
  maxStock: number | null;
};

export type CartState = {
  lines: CartLine[];
  discount: number;
  customerName: string;
};

type Action =
  | { type: "ADD"; line: Omit<CartLine, "lineId" | "qty">; qty?: number }
  | { type: "INC"; lineId: string }
  | { type: "DEC"; lineId: string }
  | { type: "SET_QTY"; lineId: string; qty: number }
  | { type: "REMOVE"; lineId: string }
  | { type: "SET_DISCOUNT"; discount: number }
  | { type: "SET_CUSTOMER"; name: string }
  | { type: "CLEAR" }
  | { type: "HOLD" }
  | { type: "RECALL"; lines: CartLine[]; discount: number; customerName: string }
  | { type: "HYDRATE"; lines: CartLine[]; discount: number; customerName: string };

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "ADD": {
      const qty = action.qty ?? 1;
      const key = action.line.variantId ?? action.line.productId;
      const existing = state.lines.find((l) => l.lineId === key);
      if (existing) {
        const next = Math.min(
          existing.qty + qty,
          existing.maxStock ?? Number.MAX_SAFE_INTEGER,
        );
        return {
          ...state,
          lines: state.lines.map((l) =>
            l.lineId === key ? { ...l, qty: next } : l,
          ),
        };
      }
      const line: CartLine = {
        ...action.line,
        lineId: key,
        qty,
      };
      return { ...state, lines: [...state.lines, line] };
    }
    case "INC":
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.lineId === action.lineId
            ? {
                ...l,
                qty: Math.min(l.qty + 1, l.maxStock ?? Number.MAX_SAFE_INTEGER),
              }
            : l,
        ),
      };
    case "DEC":
      return {
        ...state,
        lines: state.lines
          .map((l) =>
            l.lineId === action.lineId ? { ...l, qty: l.qty - 1 } : l,
          )
          .filter((l) => l.qty > 0),
      };
    case "SET_QTY":
      if (action.qty <= 0) {
        return {
          ...state,
          lines: state.lines.filter((l) => l.lineId !== action.lineId),
        };
      }
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.lineId === action.lineId
            ? {
                ...l,
                qty: Math.min(
                  action.qty,
                  l.maxStock ?? Number.MAX_SAFE_INTEGER,
                ),
              }
            : l,
        ),
      };
    case "REMOVE":
      return {
        ...state,
        lines: state.lines.filter((l) => l.lineId !== action.lineId),
      };
    case "SET_DISCOUNT":
      return { ...state, discount: Math.max(0, action.discount) };
    case "SET_CUSTOMER":
      return { ...state, customerName: action.name };
    case "CLEAR":
      return { lines: [], discount: 0, customerName: "" };
    case "HOLD":
      return { lines: [], discount: 0, customerName: "" };
    case "RECALL":
    case "HYDRATE":
      return {
        lines: action.lines,
        discount: action.discount,
        customerName: action.customerName,
      };
    default:
      return state;
  }
}

const initialState: CartState = {
  lines: [],
  discount: 0,
  customerName: "",
};

/* ------------------------------------------------------------------
 * Context
 * ------------------------------------------------------------------ */
export type HeldSale = {
  id: string;
  label: string;
  lines: CartLine[];
  discount: number;
  customerName: string;
  heldAt: number;
};

type CartContextValue = {
  state: CartState;
  addLine: (line: Omit<CartLine, "lineId" | "qty">, qty?: number) => void;
  inc: (lineId: string) => void;
  dec: (lineId: string) => void;
  setQty: (lineId: string, qty: number) => void;
  remove: (lineId: string) => void;
  setDiscount: (value: number) => void;
  setCustomer: (name: string) => void;
  clear: () => void;
  hold: () => void;
  recall: (held: HeldSale) => void;
  heldSales: HeldSale[];
  removeHeld: (id: string) => void;
  /** Derived totals. */
  totals: { subtotal: number; total: number; itemCount: number };
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "kapabara.pos.cart";
const HELD_KEY = "kapabara.pos.held";

function loadCartFromStorage(): CartState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as CartState;
    return {
      lines: parsed.lines ?? [],
      discount: parsed.discount ?? 0,
      customerName: parsed.customerName ?? "",
    };
  } catch {
    return initialState;
  }
}

function loadHeld(): HeldSale[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HELD_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HeldSale[];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const hydrated = useRef(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const loaded = loadCartFromStorage();
    dispatch({
      type: "HYDRATE",
      lines: loaded.lines,
      discount: loaded.discount,
      customerName: loaded.customerName,
    });
    setHeldSales(loadHeld());
  }, []);

  // Persist cart state on change (after hydration).
  useEffect(() => {
    if (!hydrated.current) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Persist held sales on change.
  useEffect(() => {
    if (!hydrated.current) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HELD_KEY, JSON.stringify(heldSales));
  }, [heldSales]);

  const addLine = useCallback(
    (line: Omit<CartLine, "lineId" | "qty">, qty = 1) => {
      dispatch({ type: "ADD", line, qty });
    },
    [],
  );
  const inc = useCallback(
    (lineId: string) => dispatch({ type: "INC", lineId }),
    [],
  );
  const dec = useCallback(
    (lineId: string) => dispatch({ type: "DEC", lineId }),
    [],
  );
  const setQty = useCallback(
    (lineId: string, qty: number) => dispatch({ type: "SET_QTY", lineId, qty }),
    [],
  );
  const remove = useCallback(
    (lineId: string) => dispatch({ type: "REMOVE", lineId }),
    [],
  );
  const setDiscount = useCallback(
    (value: number) => dispatch({ type: "SET_DISCOUNT", discount: value }),
    [],
  );
  const setCustomer = useCallback(
    (name: string) => dispatch({ type: "SET_CUSTOMER", name }),
    [],
  );
  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const hold = useCallback(() => {
    if (state.lines.length === 0) return;
    const id = `held-${Date.now()}`;
    const label = state.customerName || `Sale ${id.slice(-4)}`;
    const held: HeldSale = {
      id,
      label,
      lines: state.lines,
      discount: state.discount,
      customerName: state.customerName,
      heldAt: Date.now(),
    };
    setHeldSales((prev) => [...prev, held]);
    dispatch({ type: "HOLD" });
  }, [state]);

  const recall = useCallback((held: HeldSale) => {
    dispatch({
      type: "RECALL",
      lines: held.lines,
      discount: held.discount,
      customerName: held.customerName,
    });
    setHeldSales((prev) => prev.filter((h) => h.id !== held.id));
  }, []);

  const removeHeld = useCallback((id: string) => {
    setHeldSales((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const totals = useMemo(() => {
    const subtotal = state.lines.reduce(
      (s, l) => s + l.unitPrice * l.qty,
      0,
    );
    const total = Math.max(0, subtotal - state.discount);
    const itemCount = state.lines.reduce((s, l) => s + l.qty, 0);
    return { subtotal, total, itemCount };
  }, [state.lines, state.discount]);

  const value = useMemo<CartContextValue>(
    () => ({
      state,
      addLine,
      inc,
      dec,
      setQty,
      remove,
      setDiscount,
      setCustomer,
      clear,
      hold,
      recall,
      removeHeld,
      heldSales,
      totals,
    }),
    [
      state,
      addLine,
      inc,
      dec,
      setQty,
      remove,
      setDiscount,
      setCustomer,
      clear,
      hold,
      recall,
      removeHeld,
      heldSales,
      totals,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within <CartProvider>");
  }
  return ctx;
}
