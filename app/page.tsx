"use client"

import { useState, useCallback } from "react"
import { FileSpreadsheet, RotateCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/file-upload"
import { ReconciliationResults } from "@/components/reconciliation-results"
import { parseCSV, reconcileData, type ParsedData, type DiscrepancyResult } from "@/lib/invoice-parser"

export default function InvoiceReconciler() {
  const [invoiceData, setInvoiceData] = useState<ParsedData | null>(null)
  const [backendData, setBackendData] = useState<ParsedData | null>(null)
  const [invoiceFileName, setInvoiceFileName] = useState<string>("")
  const [backendFileName, setBackendFileName] = useState<string>("")
  const [results, setResults] = useState<DiscrepancyResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleInvoiceUpload = useCallback((content: string, fileName: string) => {
    console.log("[v0] Invoice file uploaded:", fileName)
    console.log("[v0] Invoice content length:", content.length)
    const parsed = parseCSV(content)
    console.log("[v0] Parsed invoice items:", parsed.items.length)
    console.log("[v0] Sample invoice item:", parsed.items[0])
    setInvoiceData(parsed)
    setInvoiceFileName(fileName)
    setResults(null)
  }, [])

  const handleBackendUpload = useCallback((content: string, fileName: string) => {
    console.log("[v0] Backend file uploaded:", fileName)
    console.log("[v0] Backend content length:", content.length)
    const parsed = parseCSV(content)
    console.log("[v0] Parsed backend items:", parsed.items.length)
    console.log("[v0] Sample backend item:", parsed.items[0])
    setBackendData(parsed)
    setBackendFileName(fileName)
    setResults(null)
  }, [])

  const handleReconcile = useCallback(async () => {
    console.log("[v0] Reconciliation started")
    console.log("[v0] Invoice data:", invoiceData)
    console.log("[v0] Backend data:", backendData)

    if (!invoiceData || !backendData) {
      console.log("[v0] ERROR: Missing data - invoice:", !!invoiceData, "backend:", !!backendData)
      return
    }

    setIsProcessing(true)

    // Use setTimeout to allow UI to update before heavy processing
    await new Promise((resolve) => setTimeout(resolve, 100))

    try {
      console.log("[v0] Calling reconcileData...")
      const reconciliationResults = reconcileData(invoiceData, backendData)
      console.log("[v0] Reconciliation complete:", reconciliationResults)
      console.log(
        "[v0] Results - Matching:",
        reconciliationResults.matching.length,
        "Missing:",
        reconciliationResults.missing.length,
        "Extras:",
        reconciliationResults.extras.length,
        "Discrepancies:",
        reconciliationResults.discrepancies.length,
      )
      setResults(reconciliationResults)
    } catch (error) {
      console.error("[v0] Error during reconciliation:", error)
    } finally {
      setIsProcessing(false)
      console.log("[v0] Processing complete")
    }
  }, [invoiceData, backendData])

  const handleReset = useCallback(() => {
    setInvoiceData(null)
    setBackendData(null)
    setInvoiceFileName("")
    setBackendFileName("")
    setResults(null)
  }, [])

  const canReconcile = invoiceData && backendData && !isProcessing

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Invoice Reconciler</h1>
                <p className="text-sm text-muted-foreground">Quick invoice verification & validation</p>
              </div>
            </div>
            {(invoiceData || backendData) && (
              <Button variant="outline" onClick={handleReset} className="text-foreground bg-transparent">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!results ? (
          <div className="space-y-8">
            {/* Upload Section */}
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-foreground mb-2">Upload Your Files</h2>
                <p className="text-muted-foreground">
                  Upload the supplier invoice and your backend data file to start reconciliation. We'll compare both
                  files and highlight any discrepancies.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FileUpload
                  label="Supplier Invoice"
                  description="The invoice file from your supplier"
                  onFileUpload={handleInvoiceUpload}
                  uploadedFileName={invoiceFileName}
                />
                <FileUpload
                  label="Backend Data"
                  description="Your internal order/transaction records"
                  onFileUpload={handleBackendUpload}
                  uploadedFileName={backendFileName}
                />
              </div>

              {invoiceData && backendData && (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Invoice: {invoiceData.items.length} records • Backend: {backendData.items.length} records
                  </div>
                  <Button size="lg" onClick={handleReconcile} disabled={!canReconcile} className="min-w-[200px]">
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Start Reconciliation"
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">How it works</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    1
                  </div>
                  <h4 className="font-medium text-foreground">Upload Files</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload your supplier invoice CSV and your backend data CSV file
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    2
                  </div>
                  <h4 className="font-medium text-foreground">Automatic Matching</h4>
                  <p className="text-sm text-muted-foreground">
                    We match records by Order ID and compare quantities, prices, and totals
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    3
                  </div>
                  <h4 className="font-medium text-foreground">Review & Export</h4>
                  <p className="text-sm text-muted-foreground">
                    Review discrepancies, missing orders, and extras. Export reports as needed
                  </p>
                </div>
              </div>
            </div>

            {/* Sample Format */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Expected CSV Format</h3>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-muted-foreground">
                  {`Order ID,Description,Quantity,Unit Price,Total,Date
ORD-001,Widget A,10,25.00,250.00,2024-01-15
ORD-002,Widget B,5,50.00,250.00,2024-01-16
ORD-003,Service Fee,1,100.00,100.00,2024-01-17`}
                </pre>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Column names are flexible - we'll automatically detect common variations like "Order", "ID", "PO
                Number", "Qty", "Price", "Amount", etc.
              </p>
            </div>
          </div>
        ) : (
          <ReconciliationResults results={results} />
        )}
      </main>
    </div>
  )
}
