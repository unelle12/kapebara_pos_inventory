import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { db } from "~/server/db";
import { auth } from "~/server/auth";
import { hasRole } from "~/lib/permissions";

const querySchema = z.object({
  search: z.string().trim().max(80).optional(),
  categoryId: z.string().cuid().optional(),
  stockStatus: z
    .enum(["ALL", "OK", "LOW", "OUT", "TRACK_OFF"])
    .default("ALL"),
});

/**
 * GET /api/stock/export?search=&categoryId=&stockStatus=
 * Returns a CSV of variants matching the same filters as the stock page.
 * Manager+ only.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasRole(session.user.role, "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
    stockStatus: searchParams.get("stockStatus") ?? "ALL",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { search, categoryId, stockStatus } = parsed.data;

  // Build the same where-clause as the stock router
  const where: Parameters<typeof db.productVariant.findMany>[0] extends infer T
    ? T extends { where?: infer W }
      ? W
      : never
    : never = { active: true };
  if (categoryId) where.product = { categoryId };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { product: { name: { contains: search, mode: "insensitive" } } },
      { product: { sku: { contains: search, mode: "insensitive" } } },
    ];
  }

  const variants = await db.productVariant.findMany({
    where,
    orderBy: [{ stock: "asc" }, { name: "asc" }],
    include: {
      product: {
        select: {
          name: true,
          sku: true,
          trackStock: true,
          lowStockThreshold: true,
          category: { select: { name: true } },
          supplier: { select: { name: true } },
        },
      },
    },
  });

  // Compute status and filter
  const rows = variants
    .map((v) => {
      const status = !v.product.trackStock
        ? "TRACK_OFF"
        : v.stock === 0
          ? "OUT"
          : v.stock <= v.product.lowStockThreshold
            ? "LOW"
            : "OK";
      return { v, status };
    })
    .filter(({ status }) => stockStatus === "ALL" || status === stockStatus);

  // Build CSV
  const header = [
    "Variant SKU",
    "Variant Name",
    "Product Name",
    "Product SKU",
    "Category",
    "Supplier",
    "Stock",
    "Threshold",
    "Status",
    "Price (PHP)",
    "Cost (PHP)",
    "Margin %",
    "Attributes",
    "Tracked",
  ];

  const lines = [header.map(escapeCell).join(",")];
  for (const { v, status } of rows) {
    const price = Number(v.price);
    const cost = Number(v.cost);
    const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : "0";
    const attrStr = Object.entries(
      v.attributes as Record<string, string>,
    )
      .map(([k, val]) => `${k}: ${val}`)
      .join("; ");
    lines.push(
      [
        v.sku,
        v.name,
        v.product.name,
        v.product.sku,
        v.product.category.name,
        v.product.supplier?.name ?? "",
        v.stock,
        v.product.lowStockThreshold,
        status,
        price.toFixed(2),
        cost.toFixed(2),
        margin,
        attrStr,
        v.product.trackStock ? "yes" : "no",
      ]
        .map(escapeCell)
        .join(","),
    );
  }

  const body = lines.join("\n");
  const filename = `kapabara-stock-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** RFC 4180: wrap in double-quotes if the value contains comma, quote, or newline. */
function escapeCell(value: unknown): string {
  const s =
    value === null || value === undefined
      ? ""
      : typeof value === "string"
        ? value
        : typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : JSON.stringify(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
