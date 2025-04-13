import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    // Create a handler for keydown to prevent text selection when using shift key
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Call the original onKeyDown handler if it exists
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
      
      // Prevent text selection when shift key is used for typing capital letters
      if (e.key === 'Shift') {
        e.preventDefault();
      }
    };
    
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
