import type React from "react"
import { Label } from "@/components/ui/label"

interface RequiredFieldLabelProps {
  htmlFor: string
  children: React.ReactNode
  optional?: boolean
}

export function RequiredFieldLabel({ htmlFor, children, optional = false }: RequiredFieldLabelProps) {
  return (
    <Label htmlFor={htmlFor} className="flex items-center">
      {children}
      {!optional && <span className="text-red-500 ml-1">*</span>}
    </Label>
  )
}
