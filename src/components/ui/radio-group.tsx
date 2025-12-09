import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupContextValue {
  value: string
  onValueChange: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | undefined>(undefined)

interface RadioGroupProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

const RadioGroup = ({ value, onValueChange, children, className }: RadioGroupProps) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={cn("space-y-2", className)}>{children}</div>
    </RadioGroupContext.Provider>
  )
}

interface RadioGroupItemProps {
  value: string
  id?: string
  children: React.ReactNode
  className?: string
}

const RadioGroupItem = ({ value, id, children, className }: RadioGroupItemProps) => {
  const context = React.useContext(RadioGroupContext)
  if (!context) throw new Error("RadioGroupItem must be used within RadioGroup")

  const isSelected = context.value === value
  const inputId = id || `radio-${value}`

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <input
        type="radio"
        id={inputId}
        value={value}
        checked={isSelected}
        onChange={() => context.onValueChange(value)}
        className="h-4 w-4 text-primary focus:ring-2 focus:ring-ring"
      />
      <label htmlFor={inputId} className="text-sm font-medium leading-none cursor-pointer">
        {children}
      </label>
    </div>
  )
}

export { RadioGroup, RadioGroupItem }

