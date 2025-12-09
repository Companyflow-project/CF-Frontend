import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface AccordionItemContextValue {
  open: boolean
  onToggle: () => void
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | undefined>(undefined)

interface AccordionProps {
  type?: "single" | "multiple"
  defaultValue?: string | string[]
  children: React.ReactNode
  className?: string
}

const Accordion = ({ type = "single", defaultValue, children, className }: AccordionProps) => {
  const [openItems, setOpenItems] = React.useState<string[]>(
    Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []
  )

  const handleToggle = (value: string) => {
    if (type === "single") {
      setOpenItems(openItems.includes(value) ? [] : [value])
    } else {
      setOpenItems(
        openItems.includes(value)
          ? openItems.filter((item) => item !== value)
          : [...openItems, value]
      )
    }
  }

  return (
    <div className={cn("w-full", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === AccordionItem) {
          const value = child.props.value
          return (
            <AccordionItemContext.Provider
              value={{
                open: openItems.includes(value),
                onToggle: () => handleToggle(value),
              }}
            >
              {child}
            </AccordionItemContext.Provider>
          )
        }
        return child
      })}
    </div>
  )
}

interface AccordionItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

const AccordionItem = ({ value: _value, children, className }: AccordionItemProps) => {
  return <div className={cn("border-b", className)}>{children}</div>
}

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(AccordionItemContext)
  if (!context) throw new Error("AccordionTrigger must be used within AccordionItem")

  return (
    <button
      ref={ref}
      type="button"
      onClick={context.onToggle}
      className={cn(
        "flex w-full items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </button>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(AccordionItemContext)
  if (!context) throw new Error("AccordionContent must be used within AccordionItem")

  if (!context.open) return null

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        className
      )}
      {...props}
    >
      <div className="pb-4 pt-0">{children}</div>
    </div>
  )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

