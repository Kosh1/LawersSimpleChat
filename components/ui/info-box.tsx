import * as React from "react"
import { cn } from "@/lib/utils"

export interface InfoBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "muted"
}

const InfoBox = React.forwardRef<HTMLDivElement, InfoBoxProps>(
  ({ className, variant = "default", style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card text-card-foreground transition-all",
          variant === "muted" 
            ? "border-border/60 bg-muted/30" 
            : "border-border",
          className
        )}
        style={{
          boxShadow: variant === "muted" 
            ? "0 4px 14px rgba(0, 0, 0, 0.12)" 
            : "0 1px 3px rgba(0, 0, 0, 0.1)",
          ...style
        }}
        {...props}
      />
    )
  }
)
InfoBox.displayName = "InfoBox"

export { InfoBox }

