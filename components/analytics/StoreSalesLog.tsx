import React from "react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { createClient } from "@supabase/supabase-js"
import type { AnalyticsTablesFilter } from "@/utils/date-filters"

async function getSalesLogs(tables: AnalyticsTablesFilter) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Fetch Log Rows
  let logQuery = supabase
    .from("sales")
    .select(
      "id, product_id, quantity, total_price, created_at, products(name, category)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })

  if (tables.mode === "range") {
    const startTs = tables.startDate + "T00:00:00"
    const endTs = tables.endDate + "T23:59:59"
    logQuery = logQuery.gte("created_at", startTs).lte("created_at", endTs)
  }

  const { data: sales, count, error } = await logQuery.limit(50)
  if (error) {
    console.error("Failed to load sales logs:", error)
    return { rows: [], total: 0, summaryRows: [] }
  }

  // 2. Fetch all sales for the summary
  let summaryQuery = supabase
    .from("sales")
    .select("product_id, quantity, products(name, category)")

  if (tables.mode === "range") {
    const startTs = tables.startDate + "T00:00:00"
    const endTs = tables.endDate + "T23:59:59"
    summaryQuery = summaryQuery.gte("created_at", startTs).lte("created_at", endTs)
  }

  const { data: allSales } = await summaryQuery

  // Aggregate summary
  const itemSummary: Record<string, { name: string; category: string; totalSold: number }> = {}
  ;(allSales || []).forEach((s: any) => {
    const pId = s.product_id
    if (!itemSummary[pId]) {
      itemSummary[pId] = {
        name: s.products?.name || "Unknown Product",
        category: s.products?.category || "Uncategorized",
        totalSold: 0,
      }
    }
    itemSummary[pId].totalSold += Number(s.quantity || 0)
  })

  const summaryRows = Object.values(itemSummary).sort((a, b) => b.totalSold - a.totalSold)

  const today     = new Date().toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

  const rows = (sales || []).map((s) => {
    const saleTimestamp = (s as any).created_at
    const dateObj = new Date(saleTimestamp)
    const dateStr = dateObj.toISOString().split("T")[0]
    const timeStr = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })

    let dateLabel = ""
    if (dateStr === today) dateLabel = `Today, ${timeStr}`
    else if (dateStr === yesterday) dateLabel = `Yesterday, ${timeStr}`
    else {
      dateLabel = `${dateObj.toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
      })}, ${timeStr}`
    }

    const product = (s as any).products

    return {
      id: s.id,
      date: dateLabel,
      productName: product?.name || "Unknown Product",
      category: product?.category || "Uncategorized",
      quantity: s.quantity,
      totalPrice:
        s.total_price != null
          ? `₱${Number(s.total_price).toFixed(2)}`
          : "—",
    }
  })

  return { rows, total: count ?? 0, summaryRows }
}

export async function StoreSalesLog({
  tables,
  periodLabel,
}: {
  tables: AnalyticsTablesFilter
  periodLabel: string
}) {
  const { rows, total, summaryRows } = await getSalesLogs(tables)

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-white/[0.05] gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Item Sales Summary</h3>
            <p className="text-sm text-gray-400 mt-1">
              Total quantities sold per item — <span className="text-gray-300">{periodLabel}</span>
            </p>
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Product Name</th>
                <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Category</th>
                <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider text-right">Total Sold</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((item, idx) => (
                <tr key={idx} className="cursor-pointer hover:bg-white/[0.02] transition-colors border-b border-white/[0.02]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {item.name.charAt(0)}
                      </div>
                      <span className="font-medium text-white">{item.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="neutral">
                      {item.category}
                    </Badge>
                  </td>
                  <td className="p-4 font-bold text-white text-right">{item.totalSold}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {summaryRows.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No sales summary found for <span className="text-gray-400">{periodLabel}</span>.
            </div>
          )}
        </div>
      </Card>

      <Card className="flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-white/[0.05] gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Recent Store Sales Log</h3>
            <p className="text-sm text-gray-400 mt-1">
              History of individual store sales — <span className="text-gray-300">{periodLabel}</span>
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            {total.toLocaleString()} total sales
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Date</th>
                <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Product Name</th>
                <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Category</th>
                <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider text-right">Quantity</th>
                <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider text-right">Total Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((log) => (
                <tr key={log.id} className="cursor-pointer hover:bg-white/[0.02] transition-colors border-b border-white/[0.02]">
                  <td className="p-4 text-sm text-gray-300">{log.date}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {log.productName.charAt(0)}
                      </div>
                      <span className="font-medium text-white">{log.productName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="neutral">
                      {log.category}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-gray-400 text-right">{log.quantity}</td>
                  <td className="p-4 font-bold text-white text-right">{log.totalPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No store sales found for <span className="text-gray-400">{periodLabel}</span>.
            </div>
          )}
        </div>

        <div className="p-4 flex items-center justify-between text-sm text-gray-400 border-t border-white/[0.05]">
          <div>Showing {rows.length} of {total.toLocaleString()} entries</div>
        </div>
      </Card>
    </div>
  )
}

