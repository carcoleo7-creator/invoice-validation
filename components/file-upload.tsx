"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Upload, FileText, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  label: string
  description: string
  onFileUpload: (content: string, fileName: string) => void
  uploadedFileName?: string
  accept?: string
}

export function FileUpload({
  label,
  description,
  onFileUpload,
  uploadedFileName,
  accept = ".csv,.xlsx,.xls",
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleFile = useCallback(
    async (file: File) => {
      setIsLoading(true)
      try {
        const content = await file.text()
        onFileUpload(content, file.name)
      } catch (error) {
        console.error("Error reading file:", error)
      } finally {
        setIsLoading(false)
      }
    },
    [onFileUpload],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile],
  )

  return (
    <Card
      className={cn(
        "relative transition-all duration-200 border-2 border-dashed",
        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50",
        uploadedFileName && "border-success/50 bg-success/5",
      )}
    >
      <CardContent className="p-6">
        <div
          className="flex flex-col items-center justify-center gap-4 cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={isLoading}
          />

          <div className={cn("p-4 rounded-full", uploadedFileName ? "bg-success/10" : "bg-muted")}>
            {uploadedFileName ? (
              <CheckCircle className="h-8 w-8 text-success" />
            ) : isLoading ? (
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          <div className="text-center">
            <h3 className="font-semibold text-foreground">{label}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>

          {uploadedFileName ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{uploadedFileName}</span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Drag & drop or click to upload (CSV)</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
