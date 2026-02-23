export interface InvoiceItem {
  orderId: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  totalDue?: number
  deliveryFee?: number
  mileageFee?: number
  waitFee?: number
  refund?: number
  adjustments?: number
  date?: string
  [key: string]: string | number | undefined
}

export interface ParsedData {
  items: InvoiceItem[]
  headers: string[]
  rawData: string[][]
}

export interface DiscrepancyResult {
  matching: InvoiceItem[]
  missing: InvoiceItem[]
  extras: InvoiceItem[]
  discrepancies: {
    invoiceItem: InvoiceItem
    backendItem: InvoiceItem
    differences: {
      field: string
      invoiceValue: string | number
      backendValue: string | number
      feeBreakdown?: {
        deliveryFee?: number
        mileageFee?: number
        waitFee?: number
        refund?: number
        adjustments?: number
      }
    }[]
  }[]
}

function cleanContent(content: string): string {
  // Remove BOM
  let cleaned = content.replace(/^\uFEFF/, "")
  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  return cleaned
}

// Parse CSV content with support for large datasets
export function parseCSV(content: string): ParsedData {
  const cleanedContent = cleanContent(content)
  const lines = cleanedContent.trim().split("\n")

  if (lines.length === 0) {
    return { items: [], headers: [], rawData: [] }
  }

  // Look for a row containing "Ord" or "ORDER" to identify the header row
  let headerRowIndex = 0
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i].toLowerCase()
    if (
      line.includes("ord #") ||
      line.includes("ord#") ||
      line.includes("order_number") ||
      line.includes("order number")
    ) {
      headerRowIndex = i
      console.log(`[v0] Found header row at line ${i}`)
      break
    }
  }

  const headers = parseCSVLine(lines[headerRowIndex])

  console.log("[v0] ========== FILE PARSING ==========")
  console.log("[v0] Header row index:", headerRowIndex)
  console.log("[v0] Total lines:", lines.length)
  console.log("[v0] Headers found:", headers.length)
  headers.forEach((h, i) => console.log(`[v0] Column ${i}: "${h}"`))

  const rawData: string[][] = []
  const items: InvoiceItem[] = []

  const batchSize = 1000
  for (let i = headerRowIndex + 1; i < lines.length; i += batchSize) {
    const batch = lines.slice(i, Math.min(i + batchSize, lines.length))

    for (const line of batch) {
      if (!line.trim()) continue

      const values = parseCSVLine(line)
      rawData.push(values)

      const item = mapToInvoiceItem(headers, values)
      if (item) {
        items.push(item)
      }
    }
  }

  console.log("[v0] Items parsed:", items.length)
  if (items.length > 0) {
    console.log("[v0] First item:", JSON.stringify(items[0], null, 2))
  }

  return { items, headers, rawData }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

function normalizeOrderId(orderId: string): string {
  return orderId
    .replace(/[-\s_#]/g, "")
    .toLowerCase()
    .trim()
}

let lastLoggedHeaders: string[] | null = null

function findColumnIndex(headers: string[], searchTerms: string[]): number {
  // Only log headers once per unique file
  if (lastLoggedHeaders !== headers) {
    lastLoggedHeaders = headers
  }

  for (const term of searchTerms) {
    const termLower = term.toLowerCase().trim()

    // Exact match (case-insensitive)
    for (let i = 0; i < headers.length; i++) {
      if (headers[i].toLowerCase().trim() === termLower) {
        return i
      }
    }

    // Contains match
    for (let i = 0; i < headers.length; i++) {
      if (headers[i].toLowerCase().includes(termLower)) {
        return i
      }
    }
  }

  return -1
}

function mapToInvoiceItem(headers: string[], values: string[]): InvoiceItem | null {
  if (values.length === 0 || values.every((v) => !v.trim())) return null

  let orderIdIndex = -1
  const headerLower = headers.map((h) => h.toLowerCase().trim())

  // Check exact matches first
  const orderIdTerms = ["ord #", "order_number", "order number", "order #", "orderid", "order id", "order"]
  for (const term of orderIdTerms) {
    const idx = headerLower.findIndex((h) => h === term)
    if (idx >= 0) {
      orderIdIndex = idx
      break
    }
  }

  // If no exact match, try contains
  if (orderIdIndex < 0) {
    for (const term of orderIdTerms) {
      const idx = headerLower.findIndex((h) => h.includes(term))
      if (idx >= 0) {
        orderIdIndex = idx
        break
      }
    }
  }

  const orderId = orderIdIndex >= 0 ? values[orderIdIndex]?.trim() || "" : ""

  if (!orderId) {
    return null
  }

  let totalIndex = -1
  const totalTerms = ["total for order", "total_due", "total due", "order total"]
  for (const term of totalTerms) {
    const idx = headerLower.findIndex((h) => h === term)
    if (idx >= 0) {
      totalIndex = idx
      break
    }
  }

  // Fallback to "total" only if no specific match found
  if (totalIndex < 0) {
    totalIndex = headerLower.findIndex((h) => h === "total")
  }

  const totalValue = totalIndex >= 0 ? values[totalIndex]?.trim().replace(/[$,\s]/g, "") || "0" : "0"
  const total = Number.parseFloat(totalValue) || 0

  // Find other fee columns using simple search
  const findCol = (terms: string[]): number => {
    for (const term of terms) {
      const idx = headerLower.findIndex((h) => h === term || h.includes(term))
      if (idx >= 0) return idx
    }
    return -1
  }

  const deliveryFeeIndex = findCol(["delivery_fee", "delivery fee"])
  const mileageFeeIndex = findCol(["mileage_fee", "excess mileage charge", "mileage fee"])
  const waitFeeIndex = findCol(["wait_fee", "wait fee"])
  const refundIndex = findCol(["refund total", "refund"])
  const adjustmentsIndex = findCol([
    "adjustments",
    "addiitonal adjustments",
    "additional adjustments",
    "total toll fee",
  ])
  const dateIndex = findCol(["event_date", "date", "order date"])
  const descriptionIndex = findCol(["restaurant", "description"])

  const parseNum = (idx: number): number | undefined => {
    if (idx < 0 || !values[idx]) return undefined
    const val = Number.parseFloat(values[idx].replace(/[$,\s]/g, ""))
    return isNaN(val) ? undefined : val
  }

  const item: InvoiceItem = {
    orderId,
    description: descriptionIndex >= 0 ? values[descriptionIndex]?.trim() || "" : "",
    quantity: 0,
    unitPrice: 0,
    total,
    totalDue: parseNum(headerLower.findIndex((h) => h === "total_due" || h === "total due")),
    deliveryFee: parseNum(deliveryFeeIndex),
    mileageFee: parseNum(mileageFeeIndex),
    waitFee: parseNum(waitFeeIndex),
    refund: parseNum(refundIndex),
    adjustments: parseNum(adjustmentsIndex),
    date: dateIndex >= 0 ? values[dateIndex]?.trim() || "" : "",
  }

  return item
}

// Compare invoice data with backend data
export function reconcileData(invoiceData: ParsedData, backendData: ParsedData): DiscrepancyResult {
  const result: DiscrepancyResult = {
    matching: [],
    missing: [],
    extras: [],
    discrepancies: [],
  }

  const backendMap = new Map<string, InvoiceItem>()
  backendData.items.forEach((item) => {
    const normalizedId = normalizeOrderId(item.orderId)
    backendMap.set(normalizedId, item)
  })

  const matchedBackendIds = new Set<string>()

  // Check each invoice item against backend
  for (const invoiceItem of invoiceData.items) {
    const normalizedId = normalizeOrderId(invoiceItem.orderId)
    const backendItem = backendMap.get(normalizedId)

    if (!backendItem) {
      // Item in invoice but not in backend = Extra charge
      result.extras.push(invoiceItem)
    } else {
      matchedBackendIds.add(normalizedId)

      // Check for discrepancies in matched items
      const differences = compareItems(invoiceItem, backendItem)

      if (differences.length > 0) {
        result.discrepancies.push({
          invoiceItem,
          backendItem,
          differences,
        })
      } else {
        result.matching.push(invoiceItem)
      }
    }
  }

  // Find items in backend but not in invoice = Missing from invoice
  for (const backendItem of backendData.items) {
    const normalizedId = normalizeOrderId(backendItem.orderId)
    if (!matchedBackendIds.has(normalizedId)) {
      result.missing.push(backendItem)
    }
  }

  return result
}

function compareItems(
  invoiceItem: InvoiceItem,
  backendItem: InvoiceItem,
): { field: string; invoiceValue: string | number; backendValue: string | number; feeBreakdown?: any }[] {
  const differences: {
    field: string
    invoiceValue: string | number
    backendValue: string | number
    feeBreakdown?: any
  }[] = []

  const backendTotal = backendItem.totalDue ?? backendItem.total
  const invoiceTotal = invoiceItem.total

  // Compare totals with tolerance for floating point
  if (Math.abs(invoiceTotal - backendTotal) > 0.01) {
    const feeBreakdown = {
      deliveryFee: (invoiceItem.deliveryFee ?? 0) - (backendItem.deliveryFee ?? 0),
      mileageFee: (invoiceItem.mileageFee ?? 0) - (backendItem.mileageFee ?? 0),
      waitFee: (invoiceItem.waitFee ?? 0) - (backendItem.waitFee ?? 0),
      refund: (invoiceItem.refund ?? 0) - (backendItem.refund ?? 0),
      adjustments: (invoiceItem.adjustments ?? 0) - (backendItem.adjustments ?? 0),
    }

    differences.push({
      field: "Total",
      invoiceValue: invoiceTotal,
      backendValue: backendTotal,
      feeBreakdown,
    })
  }

  return differences
}

// Export results to CSV
export function exportToCSV(items: InvoiceItem[], filename: string): string {
  if (items.length === 0) return ""

  const headers = [
    "Order ID",
    "Description",
    "Total Due",
    "Delivery Fee",
    "Mileage Fee",
    "Wait Fee",
    "Refund",
    "Adjustments",
    "Date",
  ]
  const rows = items.map((item) => [
    item.orderId,
    item.description,
    item.totalDue?.toFixed(2) || "",
    item.deliveryFee?.toFixed(2) || "",
    item.mileageFee?.toFixed(2) || "",
    item.waitFee?.toFixed(2) || "",
    item.refund?.toFixed(2) || "",
    item.adjustments?.toFixed(2) || "",
    item.date || "",
  ])

  const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

  return csvContent
}
