/* eslint-disable no-console */
import {
  Prisma,
  PrismaClient,
  UserRole,
  StockMovementType,
  SaleStatus,
  PaymentMethod,
} from "../generated/prisma";
import { hash } from "bcryptjs";

const db = new PrismaClient();

// ------------------------------------------------------------------
// Seed configuration
// ------------------------------------------------------------------
const PASSWORD = "password123";
const SALE_DAYS = 30;

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function dec(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n.toFixed(2));
}

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randint(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pad(n: number, w = 4) {
  return n.toString().padStart(w, "0");
}

// Reference: KP-YYYYMMDD-NNNN
function makeReference(d: Date, seq: number) {
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1, 2);
  const day = pad(d.getUTCDate(), 2);
  return `KP-${y}${m}${day}-${pad(seq)}`;
}

// ------------------------------------------------------------------
// Static seed data
// ------------------------------------------------------------------
const USERS = [
  { name: "Capy Owner", email: "owner@kapabara.test", role: UserRole.OWNER },
  { name: "Mara Manager", email: "manager@kapabara.test", role: UserRole.MANAGER },
  { name: "Anna Barista", email: "anna@kapabara.test", role: UserRole.CASHIER },
  { name: "Ben Barista", email: "ben@kapabara.test", role: UserRole.CASHIER },
  { name: "Diego Trainee", email: "diego@kapabara.test", role: UserRole.CASHIER, active: false },
] as const;

const CATEGORIES = [
  { name: "Espresso Bar", icon: "Coffee", color: "espresso", sort: 1 },
  { name: "Brewed Coffee", icon: "Coffee", color: "caramel", sort: 2 },
  { name: "Cold Drinks", icon: "CupSoda", color: "sage", sort: 3 },
  { name: "Pastries", icon: "Croissant", color: "clay", sort: 4 },
  { name: "Beans & Retail", icon: "Package", color: "espresso", sort: 5 },
  { name: "Merch", icon: "ShoppingBag", color: "sage", sort: 6 },
] as const;

const SUPPLIERS = [
  {
    name: "Mountain Bean Co.",
    contact: "Liza Cruz",
    email: "liza@mountainbean.ph",
    phone: "+63 917 555 0101",
    address: "Benguet, Cordillera",
    notes: "Single-origin Arabica. Weekly delivery.",
  },
  {
    name: "Highland Dairy Cooperative",
    contact: "Tomas Reyes",
    email: "orders@highlanddairy.ph",
    phone: "+63 918 555 0202",
    address: "Bukidnon",
    notes: "Fresh whole milk, oat milk, almond milk.",
  },
  {
    name: "Pastry Kitchen",
    contact: "Ines Garcia",
    email: "hello@pastrykitchen.ph",
    phone: "+63 919 555 0303",
    address: "Quezon City",
    notes: "Baked fresh every morning at 6am.",
  },
] as const;

type VariantSeed = {
  name: string;
  skuSuffix: string;
  price: number;
  cost: number;
  stock: number;
  attributes: Record<string, string>;
};

type ProductSeed = {
  sku: string;
  name: string;
  description: string;
  basePrice: number;
  cost: number;
  categorySlug: string;
  supplier: string;
  lowStockThreshold: number;
  variants: VariantSeed[];
};

const PRODUCTS: ProductSeed[] = [
  // ---- Espresso Bar ----
  {
    sku: "ESP-LATTE",
    name: "Capy's Caramel Latte",
    description: "House espresso, steamed milk, slow-cooked caramel.",
    basePrice: 165,
    cost: 48,
    categorySlug: "espresso-bar",
    supplier: "Mountain Bean Co.",
    lowStockThreshold: 25,
    variants: [
      { name: "8oz · Hot", skuSuffix: "8H", price: 145, cost: 42, stock: 320, attributes: { size: "8oz", temp: "hot" } },
      { name: "12oz · Hot", skuSuffix: "12H", price: 165, cost: 48, stock: 380, attributes: { size: "12oz", temp: "hot" } },
      { name: "12oz · Iced", skuSuffix: "12I", price: 175, cost: 50, stock: 360, attributes: { size: "12oz", temp: "iced" } },
      { name: "16oz · Iced", skuSuffix: "16I", price: 195, cost: 56, stock: 280, attributes: { size: "16oz", temp: "iced" } },
    ],
  },
  {
    sku: "ESP-CAP",
    name: "Cappuccino",
    description: "Equal parts espresso, steamed milk and silky foam.",
    basePrice: 145,
    cost: 40,
    categorySlug: "espresso-bar",
    supplier: "Mountain Bean Co.",
    lowStockThreshold: 20,
    variants: [
      { name: "8oz · Hot", skuSuffix: "8H", price: 130, cost: 36, stock: 280, attributes: { size: "8oz", temp: "hot" } },
      { name: "12oz · Hot", skuSuffix: "12H", price: 145, cost: 40, stock: 340, attributes: { size: "12oz", temp: "hot" } },
    ],
  },
  {
    sku: "ESP-MOCHA",
    name: "Capy Mocha",
    description: "Belgian cocoa, double shot espresso, milk.",
    basePrice: 175,
    cost: 54,
    categorySlug: "espresso-bar",
    supplier: "Mountain Bean Co.",
    lowStockThreshold: 15,
    variants: [
      { name: "12oz · Hot", skuSuffix: "12H", price: 175, cost: 54, stock: 220, attributes: { size: "12oz", temp: "hot" } },
      { name: "12oz · Iced", skuSuffix: "12I", price: 185, cost: 56, stock: 200, attributes: { size: "12oz", temp: "iced" } },
    ],
  },
  {
    sku: "ESP-AME",
    name: "Americano",
    description: "Espresso topped with hot water. Clean and bold.",
    basePrice: 120,
    cost: 28,
    categorySlug: "espresso-bar",
    supplier: "Mountain Bean Co.",
    lowStockThreshold: 20,
    variants: [
      { name: "8oz · Hot", skuSuffix: "8H", price: 110, cost: 26, stock: 300, attributes: { size: "8oz", temp: "hot" } },
      { name: "12oz · Hot", skuSuffix: "12H", price: 120, cost: 28, stock: 360, attributes: { size: "12oz", temp: "hot" } },
    ],
  },
  // ---- Brewed ----
  {
    sku: "BRW-POUR",
    name: "Single-Origin Pour Over",
    description: "Rotating single origin, hand-poured to order.",
    basePrice: 195,
    cost: 52,
    categorySlug: "brewed-coffee",
    supplier: "Mountain Bean Co.",
    lowStockThreshold: 10,
    variants: [
      { name: "10oz · Hot", skuSuffix: "10H", price: 195, cost: 52, stock: 120, attributes: { size: "10oz", temp: "hot" } },
    ],
  },
  {
    sku: "BRW-FRENCH",
    name: "French Press",
    description: "Coarse-ground, full immersion, served for two.",
    basePrice: 165,
    cost: 45,
    categorySlug: "brewed-coffee",
    supplier: "Mountain Bean Co.",
    lowStockThreshold: 8,
    variants: [
      { name: "16oz · Hot", skuSuffix: "16H", price: 165, cost: 45, stock: 90, attributes: { size: "16oz", temp: "hot" } },
    ],
  },
  // ---- Cold ----
  {
    sku: "CLD-BREW",
    name: "Slow Cold Brew",
    description: "Steeped 16 hours. Smooth, low-acid.",
    basePrice: 175,
    cost: 48,
    categorySlug: "cold-drinks",
    supplier: "Mountain Bean Co.",
    lowStockThreshold: 20,
    variants: [
      { name: "12oz · Iced", skuSuffix: "12I", price: 165, cost: 46, stock: 240, attributes: { size: "12oz", temp: "iced" } },
      { name: "16oz · Iced", skuSuffix: "16I", price: 185, cost: 52, stock: 200, attributes: { size: "16oz", temp: "iced" } },
    ],
  },
  {
    sku: "CLD-MATCHA",
    name: "Matcha Latte",
    description: "Ceremonial-grade matcha, your milk of choice.",
    basePrice: 195,
    cost: 62,
    categorySlug: "cold-drinks",
    supplier: "Highland Dairy Cooperative",
    lowStockThreshold: 15,
    variants: [
      { name: "12oz · Iced", skuSuffix: "12I", price: 195, cost: 62, stock: 160, attributes: { size: "12oz", temp: "iced" } },
      { name: "16oz · Iced", skuSuffix: "16I", price: 215, cost: 68, stock: 140, attributes: { size: "16oz", temp: "iced" } },
    ],
  },
  {
    sku: "CLD-ICEDAME",
    name: "Iced Americano",
    description: "Chilled and refreshing, no sweetness.",
    basePrice: 135,
    cost: 30,
    categorySlug: "cold-drinks",
    supplier: "Mountain Bean Co.",
    lowStockThreshold: 20,
    variants: [
      { name: "12oz · Iced", skuSuffix: "12I", price: 135, cost: 30, stock: 220, attributes: { size: "12oz", temp: "iced" } },
      { name: "16oz · Iced", skuSuffix: "16I", price: 155, cost: 34, stock: 180, attributes: { size: "16oz", temp: "iced" } },
    ],
  },
  // ---- Pastries ----
  {
    sku: "PST-CROIS",
    name: "Butter Croissant",
    description: "Flaky, French-style, baked at 6am.",
    basePrice: 95,
    cost: 28,
    categorySlug: "pastries",
    supplier: "Pastry Kitchen",
    lowStockThreshold: 15,
    variants: [
      { name: "Plain", skuSuffix: "PLN", price: 95, cost: 28, stock: 80, attributes: { type: "plain" } },
      { name: "Almond", skuSuffix: "ALM", price: 115, cost: 36, stock: 48, attributes: { type: "almond" } },
      { name: "Chocolate", skuSuffix: "CHO", price: 110, cost: 34, stock: 56, attributes: { type: "chocolate" } },
    ],
  },
  {
    sku: "PST-BANANA",
    name: "Banana Bread Slice",
    description: "Walnut-loaded, slightly toasted.",
    basePrice: 85,
    cost: 22,
    categorySlug: "pastries",
    supplier: "Pastry Kitchen",
    lowStockThreshold: 10,
    variants: [
      { name: "Slice", skuSuffix: "SLC", price: 85, cost: 22, stock: 3, attributes: { type: "slice" } },
    ],
  },
  {
    sku: "PST-BROWNIE",
    name: "Fudge Brownie",
    description: "Dense, dark, sea-salt finish.",
    basePrice: 105,
    cost: 32,
    categorySlug: "pastries",
    supplier: "Pastry Kitchen",
    lowStockThreshold: 8,
    variants: [
      { name: "Square", skuSuffix: "SQR", price: 105, cost: 32, stock: 42, attributes: { type: "square" } },
    ],
  },
  // ---- Retail beans ----
  {
    sku: "RET-BEANS",
    name: "Whole Bean · 250g",
    description: "Roasted weekly. Take the café home.",
    basePrice: 480,
    cost: 220,
    categorySlug: "beans-retail",
    supplier: "Mountain Bean Co.",
    lowStockThreshold: 6,
    variants: [
      { name: "Benguet Blend", skuSuffix: "BBL", price: 480, cost: 220, stock: 65, attributes: { origin: "Benguet" } },
      { name: "Sagada Single Origin", skuSuffix: "SAG", price: 580, cost: 260, stock: 38, attributes: { origin: "Sagada" } },
      { name: "House Decaf", skuSuffix: "DEC", price: 520, cost: 240, stock: 1, attributes: { origin: "Decaf" } },
    ],
  },
  // ---- Merch ----
  {
    sku: "MCH-TUMBLER",
    name: "Capy Tumbler",
    description: "Insulated stainless, 12-hour cold.",
    basePrice: 750,
    cost: 280,
    categorySlug: "merch",
    supplier: "Pastry Kitchen",
    lowStockThreshold: 4,
    variants: [
      { name: "12oz · Caramel", skuSuffix: "12C", price: 750, cost: 280, stock: 22, attributes: { size: "12oz", color: "caramel" } },
      { name: "16oz · Caramel", skuSuffix: "16C", price: 850, cost: 320, stock: 18, attributes: { size: "16oz", color: "caramel" } },
    ],
  },
  {
    sku: "MCH-TOTE",
    name: "Capy Tote Bag",
    description: "Heavyweight canvas, screen-printed logo.",
    basePrice: 350,
    cost: 110,
    categorySlug: "merch",
    supplier: "Pastry Kitchen",
    lowStockThreshold: 5,
    variants: [
      { name: "Natural", skuSuffix: "NAT", price: 350, cost: 110, stock: 2, attributes: { color: "natural" } },
    ],
  },
];

// Force a few items into the "low stock" zone for testing alerts
const LOW_STOCK_OVERRIDES: Record<string, number> = {
  "PST-BANANA-SLC": 3,   // low
  "MCH-TOTE-NAT": 2,     // low
  "RET-BEANS-DEC": 1,    // critical
  "BRW-POUR-10H": 6,     // at threshold
};

async function main() {
  console.log("🌱 Seeding kapabara database…");

  // Wipe existing data (safe — fresh dev DB)
  await db.refund.deleteMany();
  await db.saleItem.deleteMany();
  await db.sale.deleteMany();
  await db.stockMovement.deleteMany();
  await db.productVariant.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.supplier.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.verificationToken.deleteMany();
  await db.user.deleteMany();

  // --- Users ---
  const passwordHash = await hash(PASSWORD, 10);
  const users = await Promise.all(
    USERS.map((u) =>
      db.user.create({
        data: { ...u, passwordHash },
      }),
    ),
  );
  const cashiers = users.filter((u) => u.role === UserRole.CASHIER);
  console.log(`  ✓ ${users.length} users  (password: ${PASSWORD})`);

  // --- Categories ---
  const categories = await Promise.all(
    CATEGORIES.map((c) =>
      db.category.create({
        data: { ...c, slug: slug(c.name) },
      }),
    ),
  );
  console.log(`  ✓ ${categories.length} categories`);

  // --- Suppliers ---
  const suppliers = await Promise.all(
    SUPPLIERS.map((s) => db.supplier.create({ data: s })),
  );
  console.log(`  ✓ ${suppliers.length} suppliers`);

  const supplierByName = new Map(suppliers.map((s) => [s.name, s]));
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  // --- Products + Variants ---
  const allVariants: { id: string; productId: string; price: Prisma.Decimal; cost: Prisma.Decimal; stock: number; name: string; sku: string }[] = [];
  for (const p of PRODUCTS) {
    const cat = categoryBySlug.get(p.categorySlug);
    const sup = supplierByName.get(p.supplier);
    if (!cat) throw new Error(`Category not found: ${p.categorySlug}`);
    if (!sup) throw new Error(`Supplier not found: ${p.supplier}`);

    const product = await db.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        slug: slug(p.name),
        description: p.description,
        basePrice: dec(p.basePrice),
        cost: dec(p.cost),
        lowStockThreshold: p.lowStockThreshold,
        categoryId: cat.id,
        supplierId: sup.id,
      },
    });

    for (const v of p.variants) {
      const sku = `${p.sku}-${v.skuSuffix}`;
      const stock = LOW_STOCK_OVERRIDES[sku] ?? v.stock;
      const variant = await db.productVariant.create({
        data: {
          productId: product.id,
          name: v.name,
          sku,
          price: dec(v.price),
          cost: dec(v.cost),
          stock,
          attributes: v.attributes,
        },
      });
      allVariants.push({
        id: variant.id,
        productId: product.id,
        price: variant.price,
        cost: variant.cost,
        stock: variant.stock,
        name: `${p.name} · ${v.name}`,
        sku: variant.sku,
      });
    }
  }
  console.log(`  ✓ ${PRODUCTS.length} products / ${allVariants.length} variants`);

  // --- Initial restock movements (audit trail) ---
  const owner = users.find((u) => u.role === UserRole.OWNER)!;
  for (const v of allVariants) {
    await db.stockMovement.create({
      data: {
        type: StockMovementType.RESTOCK,
        variantId: v.id,
        productId: v.productId,
        qty: v.stock,
        note: "Initial stock",
        userId: owner.id,
      },
    });
  }

  // --- Sales history (SALE_DAYS days) ---
  // Track remaining stock in memory so sales never oversell
  const stock = new Map<string, number>(allVariants.map((v) => [v.id, v.stock]));
  const pickVariant = (): (typeof allVariants)[number] | null => {
    // 85% bias toward drinks/pastries (first 23 entries)
    for (let i = 0; i < 20; i++) {
      const pool = Math.random() < 0.85 ? allVariants.slice(0, 23) : allVariants;
      const v = rand(pool);
      if ((stock.get(v.id) ?? 0) > 0) return v;
    }
    return null;
  };

  let totalSales = 0;
  let totalRevenue = 0;
  const now = new Date();
  for (let dayOffset = SALE_DAYS - 1; dayOffset >= 0; dayOffset--) {
    const day = new Date(now);
    day.setUTCDate(now.getUTCDate() - dayOffset);
    const isWeekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;
    const txCount = isWeekend ? randint(14, 22) : randint(8, 16);

    for (let seq = 1; seq <= txCount; seq++) {
      const cashier = rand(cashiers);
      const hourWeights = [
        0, 0, 0, 0, 0, 0, 3, 8, 10, 6, 5, 6, 5, 4, 5, 6, 8, 5, 3, 1, 0, 0, 0, 0,
      ];
      const totalWeight = hourWeights.reduce((a, b) => a + b, 0);
      let r = Math.random() * totalWeight;
      let hour = 0;
      for (let h = 0; h < 24; h++) {
        r -= hourWeights[h]!;
        if (r <= 0) {
          hour = h;
          break;
        }
      }
      const minute = randint(0, 59);
      const ts = new Date(day);
      ts.setUTCHours(hour, minute, randint(0, 59), 0);

      const itemCount = randint(1, 4);
      const chosen = new Set<string>();
      const items: { variantId: string; productId: string; name: string; sku: string; price: Prisma.Decimal; cost: Prisma.Decimal; qty: number; lineTotal: Prisma.Decimal }[] = [];
      let subtotal = 0;
      while (items.length < itemCount) {
        const v = pickVariant();
        if (!v || chosen.has(v.id)) break;
        chosen.add(v.id);
        const isRetail = v.sku.startsWith("RET-") || v.sku.startsWith("MCH-");
        const desired = isRetail ? 1 : randint(1, 3);
        const available = stock.get(v.id) ?? 0;
        const qty = Math.min(desired, available);
        if (qty <= 0) continue;
        stock.set(v.id, available - qty);
        const lineTotal = v.price.mul(qty);
        subtotal += lineTotal.toNumber();
        items.push({
          variantId: v.id,
          productId: v.productId,
          name: v.name,
          sku: v.sku,
          price: v.price,
          cost: v.cost,
          qty,
          lineTotal,
        });
      }
      if (items.length === 0) continue;

      // Occasional discount (10%)
      const discount = Math.random() < 0.1 ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
      const tax = 0;
      const total = Math.round((subtotal - discount + tax) * 100) / 100;

      // Payment method
      const methodRoll = Math.random();
      const method =
        methodRoll < 0.6 ? PaymentMethod.CASH : methodRoll < 0.9 ? PaymentMethod.CARD : PaymentMethod.EWALLET;

      const amountTendered = method === PaymentMethod.CASH ? total + randint(0, 100) : null;
      const change =
        method === PaymentMethod.CASH && amountTendered !== null
          ? Math.round((amountTendered - total) * 100) / 100
          : null;

      const sale = await db.sale.create({
        data: {
          reference: makeReference(ts, seq),
          status: SaleStatus.COMPLETED,
          subtotal: dec(subtotal),
          tax: dec(tax),
          discount: dec(discount),
          total: dec(total),
          paymentMethod: method,
          amountTendered: amountTendered !== null ? dec(amountTendered) : null,
          change: change !== null ? dec(change) : null,
          cashierId: cashier.id,
          createdAt: ts,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              name: i.name,
              sku: i.sku,
              qty: i.qty,
              unitPrice: i.price,
              unitCost: i.cost,
              lineTotal: i.lineTotal,
            })),
          },
        },
      });

      // Deduct stock + log movement
      for (const i of items) {
        await db.productVariant.update({
          where: { id: i.variantId },
          data: { stock: { decrement: i.qty } },
        });
        await db.stockMovement.create({
          data: {
            type: StockMovementType.SALE,
            productId: i.productId,
            variantId: i.variantId,
            qty: -i.qty,
            note: `Sale ${sale.reference}`,
            userId: cashier.id,
            createdAt: ts,
          },
        });
      }

      totalSales++;
      totalRevenue += total;
    }
  }
  console.log(
    `  ✓ ${totalSales} sales over ${SALE_DAYS} days  (₱${Math.round(totalRevenue).toLocaleString()} total)`,
  );

  // --- One sample refund (last week) ---
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setUTCDate(now.getUTCDate() - 6);
  const recentSale = await db.sale.findFirst({
    where: { createdAt: { lte: oneWeekAgo } },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  if (recentSale) {
    await db.refund.create({
      data: {
        saleId: recentSale.id,
        reason: "Customer changed mind — wrong size",
        amount: recentSale.total,
        userId: owner.id,
        createdAt: oneWeekAgo,
      },
    });
    await db.sale.update({
      where: { id: recentSale.id },
      data: { status: SaleStatus.REFUNDED },
    });
    for (const item of recentSale.items) {
      if (item.variantId) {
        await db.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.qty } },
        });
        await db.stockMovement.create({
          data: {
            type: StockMovementType.REFUND,
            productId: item.productId,
            variantId: item.variantId,
            qty: item.qty,
            note: `Refund ${recentSale.reference}`,
            userId: owner.id,
            createdAt: oneWeekAgo,
          },
        });
      }
    }
    console.log("  ✓ 1 sample refund (last week)");
  }

  console.log("\n✅ Seed complete.\n");
  console.log("Sign in with any of:");
  USERS.forEach((u) => console.log(`  • ${u.email}   (${u.role.toLowerCase()})`));
  console.log(`  password: ${PASSWORD}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
