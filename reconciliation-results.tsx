"use client"

import { useState } from "react"
import { Download, AlertTriangle, CheckCircle, XCircle, FileWarning } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { type DiscrepancyResult, type InvoiceItem, exportToCSV } from "@/lib/invoice-parser"
import { DataTable } from "./data-table"

interface ReconciliationResultsProps {
  results: DiscrepancyResult
}

export function ReconciliationResults({ results }: ReconciliationResultsProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const totalItems =
    results.matching.length + results.missing.length + results.extras.length + results.discrepancies.length

  const handleExport = (items: InvoiceItem[], type: string) => {
    const csv = exportToCSV(items, type)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${type}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = [
    {
      label: "Total Records",
      value: totalItems,
      icon: FileWarning,
      color: "text-foreground",
      bgColor: "bg-muted",
    },
    {
      label: "Matched",
      value: results.matching.length,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Discrepancies",
      value: results.discrepancies.length,
      icon: AlertTriangle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Missing Orders",
      value: results.missing.length,
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Extra Charges",
      value: results.extras.length,
      icon: AlertTriangle,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Results Tabs */}
      <Card className="bg-card border-border">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="border-b border-border pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">Reconciliation Details</CardTitle>
            </div>
            <TabsList className="bg-muted mt-4">
              <TabsTrigger value="overview" className="data-[state=active]:bg-background">
                Overview
              </TabsTrigger>
              <TabsTrigger value="matches" className="data-[state=active]:bg-background">
                Matches
                {results.matching.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-success/20 text-success">
                    {results.matching.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="discrepancies" className="data-[state=active]:bg-background">
                Discrepancies
                {results.discrepancies.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-warning/20 text-warning">
                    {results.discrepancies.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="missing" className="data-[state=active]:bg-background">
                Missing
                {results.missing.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-destructive/20 text-destructive">
                    {results.missing.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="extras" className="data-[state=active]:bg-background">
                Extras
                {results.extras.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-chart-4/20 text-chart-4">
                    {results.extras.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-6">
            <TabsContent value="overview" className="mt-0">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="bg-muted/30 border-border">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-foreground mb-2">Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Match Rate</span>
                          <span className="font-medium text-foreground">
                            {totalItems > 0 ? ((results.matching.length / totalItems) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Issues Found</span>
                          <span className="font-medium text-destructive">
                            {results.discrepancies.length + results.missing.length + results.extras.length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Invoice Amount</span>
                          <span className="font-medium text-foreground">
                            $
                            {[
                              ...results.matching,
                              ...results.extras,
                              ...results.discrepancies.map((d) => d.invoiceItem),
                            ]
                              .reduce((sum, item) => sum + item.total, 0)
                              .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/30 border-border">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-foreground mb-2">Quick Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        {results.missing.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExport(results.missing, "missing-orders")}
                            className="text-foreground"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Export Missing
                          </Button>
                        )}
                        {results.extras.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExport(results.extras, "extra-charges")}
                            className="text-foreground"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Export Extras
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="matches" className="mt-0">
              {results.matching.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Orders that matched between supplier invoice and backend data
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport(results.matching, "matched-orders")}
                      className="text-foreground"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export Matches
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {results.matching.map((item, i) => (
                      <Card key={i} className="bg-success/5 border-success/20">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">Order: {item.orderId}</p>
                              <p className="text-sm text-muted-foreground">{item.description || "N/A"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Invoice Total</p>
                              <p className="text-lg font-semibold text-success">
                                ${(item.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {(item.deliveryFee ?? 0) > 0 && (
                              <div>
                                <span className="text-muted-foreground">Delivery Fee:</span>
                                <span className="ml-2 text-foreground">${(item.deliveryFee ?? 0).toFixed(2)}</span>
                              </div>
                            )}
                            {(item.mileageFee ?? 0) > 0 && (
                              <div>
                                <span className="text-muted-foreground">Mileage Fee:</span>
                                <span className="ml-2 text-foreground">${(item.mileageFee ?? 0).toFixed(2)}</span>
                              </div>
                            )}
                            {(item.waitFee ?? 0) > 0 && (
                              <div>
                                <span className="text-muted-foreground">Wait Fee:</span>
                                <span className="ml-2 text-foreground">${(item.waitFee ?? 0).toFixed(2)}</span>
                              </div>
                            )}
                            {(item.adjustments ?? 0) !== 0 && (
                              <div>
                                <span className="text-muted-foreground">Adjustments:</span>
                                <span className="ml-2 text-foreground">${(item.adjustments ?? 0).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <XCircle className="h-12 w-12 mx-auto mb-3 text-destructive" />
                  <p>No matches found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="discrepancies" className="mt-0">
              {results.discrepancies.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card className="bg-card border-border">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Supplier Invoice</p>
                        <p className="text-xl font-semibold text-destructive">
                          ${results.discrepancies.reduce((sum, d) => sum + (d.invoiceItem.total ?? 0), 0).toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Backend</p>
                        <p className="text-xl font-semibold text-success">
                          $
                          {results.discrepancies
                            .reduce((sum, d) => sum + (d.backendItem?.total ?? d.backendItem?.totalDue ?? 0), 0)
                            .toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card border-border">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Difference</p>
                        {(() => {
                          const supplierTotal = results.discrepancies.reduce(
                            (sum, d) => sum + (d.invoiceItem.total ?? 0),
                            0,
                          )
                          const backendTotal = results.discrepancies.reduce(
                            (sum, d) => sum + (d.backendItem?.total ?? d.backendItem?.totalDue ?? 0),
                            0,
                          )
                          const diff = supplierTotal - backendTotal
                          return (
                            <p className={`text-xl font-semibold ${diff > 0 ? "text-destructive" : "text-foreground"}`}>
                              {diff > 0 ? "+" : ""}
                              {diff < 0 ? "-" : ""}${Math.abs(diff).toFixed(2)}
                            </p>
                          )
                        })()}
                      </CardContent>
                    </Card>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleExport(
                          results.discrepancies.map((d) => d.invoiceItem),
                          "discrepancies",
                        )
                      }
                      className="text-foreground"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export Discrepancies
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {results.discrepancies.map((d, i) => (
                      <Card key={i} className="bg-warning/5 border-warning/20">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-foreground">Order: {d.invoiceItem.orderId}</p>
                              <p className="text-sm text-muted-foreground">{d.invoiceItem.description}</p>
                            </div>
                            <Badge variant="outline" className="border-warning text-warning">
                              {d.differences.length} difference{d.differences.length > 1 ? "s" : ""}
                            </Badge>
                          </div>
                          <div className="mt-3 space-y-2">
                            {d.differences.map((diff, j) => (
                              <div key={j} className="space-y-2">
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground w-24">{diff.field}:</span>
                                  <span className="text-destructive">
                                    Invoice:{" "}
                                    {typeof diff.invoiceValue === "number"
                                      ? `$${diff.invoiceValue.toFixed(2)}`
                                      : diff.invoiceValue}
                                  </span>
                                  <span className="text-success">
                                    Backend:{" "}
                                    {typeof diff.backendValue === "number"
                                      ? `$${diff.backendValue.toFixed(2)}`
                                      : diff.backendValue}
                                  </span>
                                  <span
                                    className={
                                      (diff.invoiceValue as number) > (diff.backendValue as number)
                                        ? "text-destructive font-medium"
                                        : "text-foreground font-medium"
                                    }
                                  >
                                    Δ $
                                    {Math.abs((diff.invoiceValue as number) - (diff.backendValue as number)).toFixed(2)}
                                  </span>
                                </div>
                                {diff.feeBreakdown && (
                                  <div className="ml-28 p-3 bg-muted/50 rounded-md space-y-1 text-xs">
                                    <p className="font-medium text-foreground mb-2">Fee Breakdown:</p>
                                    {diff.feeBreakdown.deliveryFee !== 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Delivery Fee Difference:</span>
                                        <span
                                          className={
                                            diff.feeBreakdown.deliveryFee > 0 ? "text-destructive" : "text-foreground"
                                          }
                                        >
                                          ${Math.abs(diff.feeBreakdown.deliveryFee).toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                    {diff.feeBreakdown.mileageFee !== 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Mileage Fee Difference:</span>
                                        <span
                                          className={
                                            diff.feeBreakdown.mileageFee > 0 ? "text-destructive" : "text-foreground"
                                          }
                                        >
                                          ${Math.abs(diff.feeBreakdown.mileageFee).toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                    {diff.feeBreakdown.waitFee !== 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Wait Fee Difference:</span>
                                        <span
                                          className={
                                            diff.feeBreakdown.waitFee > 0 ? "text-destructive" : "text-foreground"
                                          }
                                        >
                                          ${Math.abs(diff.feeBreakdown.waitFee).toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                    {diff.feeBreakdown.refund !== 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Refund Difference:</span>
                                        <span
                                          className={
                                            diff.feeBreakdown.refund > 0 ? "text-destructive" : "text-foreground"
                                          }
                                        >
                                          ${Math.abs(diff.feeBreakdown.refund).toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                    {diff.feeBreakdown.adjustments !== 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Adjustments Difference:</span>
                                        <span
                                          className={
                                            diff.feeBreakdown.adjustments > 0 ? "text-destructive" : "text-foreground"
                                          }
                                        >
                                          ${Math.abs(diff.feeBreakdown.adjustments).toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-success" />
                  <p>No discrepancies found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="missing" className="mt-0">
              {results.missing.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Orders in your backend data but missing from the supplier invoice
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport(results.missing, "missing-orders")}
                      className="text-foreground"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export Missing
                    </Button>
                  </div>
                  <DataTable items={results.missing} type="missing" />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-success" />
                  <p>No missing orders</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="extras" className="mt-0">
              {results.extras.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Items on the supplier invoice not found in your backend data
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport(results.extras, "extra-charges")}
                      className="text-foreground"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export Extras
                    </Button>
                  </div>
                  <DataTable items={results.extras} type="extras" />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-success" />
                  <p>No extra charges found</p>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
