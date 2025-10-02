"use client"

import * as React from "react"
import { Check, X, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export interface OptionType {
  label: string
  value: string
}

interface MultiSelectProps {
  options: OptionType[]
  selected: string[]
  onValueChange: (selected: string[]) => void
  className?: string
  placeholder?: string
}

const MultiSelect = React.forwardRef<
  HTMLButtonElement,
  MultiSelectProps
>(({ options, selected, onValueChange, className, placeholder = 'Select...', ...props }, ref) => {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (value: string) => {
    onValueChange(selected.filter((s) => s !== value))
  }

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between ${
            selected.length > 1 ? "h-full" : "h-10"
          }`}
          onClick={() => setOpen(!open)}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length > 0 ? (
              options
                .filter((option) => selected.includes(option.value))
                .map((option) => (
                  <Badge
                    variant="secondary"
                    key={option.value}
                    className="mr-1 mb-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleUnselect(option.value);
                    }}
                  >
                    {option.label}
                     <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command className={className}>
          <CommandInput placeholder="Search ..." />
          <CommandEmpty>No item found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            <CommandList>
                {options.map((option) => (
                <CommandItem
                    key={option.value}
                    onSelect={() => {
                    onValueChange(
                        selected.includes(option.value)
                        ? selected.filter((item) => item !== option.value)
                        : [...selected, option.value]
                    )
                    setOpen(true)
                    }}
                >
                    <Check
                    className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                    />
                    {option.label}
                </CommandItem>
                ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
})

MultiSelect.displayName = "MultiSelect"

export { MultiSelect }
