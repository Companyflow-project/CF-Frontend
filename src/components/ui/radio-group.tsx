import * as React from "react"
import { cn } from "@/lib/utils"

type RadioVariant = "card" | "simple"

interface RadioGroupContextValue {
  value: string
  onValueChange: (value: string) => void
  variant: RadioVariant
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | undefined>(undefined)

interface RadioGroupProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
  variant?: RadioVariant
}

const RadioGroup = ({ value, onValueChange, children, className, variant = "simple" }: RadioGroupProps) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, variant }}>
      <div className={cn(variant === "simple" ? "flex flex-wrap gap-2" : "space-y-2", className)}>{children}</div>
    </RadioGroupContext.Provider>
  )
}

interface RadioGroupItemProps {
  value: string
  id?: string
  children: React.ReactNode
  description?: string
  className?: string
}

const RadioGroupItem = ({ value, id, children, description, className }: RadioGroupItemProps) => {
  const context = React.useContext(RadioGroupContext)
  if (!context) throw new Error("RadioGroupItem must be used within RadioGroup")

  const isSelected = context.value === value
  const inputId = id || `radio-${value}`

  if (context.variant === "card") {
    return (
      <label
        htmlFor={inputId}
        className={cn(
          "flex items-center gap-3 cursor-pointer rounded-lg border px-4 py-3 transition-all",
          isSelected
            ? "border-[#3d997d] bg-[#f0f9f6] shadow-sm"
            : "border-[#e5e7eb] bg-white hover:border-[#c8d8d3] hover:bg-[#fafcfb]",
          className
        )}
      >
        <input
          type="radio"
          id={inputId}
          value={value}
          checked={isSelected}
          onChange={() => context.onValueChange(value)}
          className="sr-only"
        />
        <div
          className={cn(
            "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            isSelected ? "border-[#3d997d]" : "border-[#c8d8d3]"
          )}
        >
          {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-[#3d997d]" />}
        </div>
        <div className="flex flex-col">
          <span className={cn("text-sm leading-none", isSelected ? "font-semibold text-[#1a5948]" : "font-medium text-[#0d0e0e]")}>
            {children}
          </span>
          {description && (
            <span className="text-xs text-[#7b8a85] mt-1">{description}</span>
          )}
        </div>
      </label>
    )
  }

  // Simple variant — clean, compact radio buttons
  return (
    <label
      htmlFor={inputId}
      className={cn(
        "inline-flex items-center gap-2 cursor-pointer text-sm select-none",
        className
      )}
    >
      <input
        type="radio"
        id={inputId}
        value={value}
        checked={isSelected}
        onChange={() => context.onValueChange(value)}
        className="sr-only"
      />
      <div
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          isSelected ? "border-[#3d997d]" : "border-gray-300"
        )}
      >
        {isSelected && <div className="h-2 w-2 rounded-full bg-[#3d997d]" />}
      </div>
      <span className={cn(isSelected ? "font-medium text-[#0d0e0e]" : "text-[#4b5563]")}>
        {children}
      </span>
    </label>
  )
}

export { RadioGroup, RadioGroupItem }
