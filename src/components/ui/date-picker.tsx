"use client"

import * as React from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DateTimePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  showTime?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "날짜와 시간을 선택하세요",
  className,
  showTime = true,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )
  const [timeValue, setTimeValue] = React.useState(
    value ? format(new Date(value), "HH:mm") : ""
  )

  React.useEffect(() => {
    if (!value) {
      setDate(undefined)
      setTimeValue("")
      return
    }

    const next = new Date(value)
    if (Number.isNaN(next.getTime())) {
      return
    }

    setDate(next)
    setTimeValue(format(next, "HH:mm"))
  }, [value])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const [hours, minutes] = timeValue.split(":").map(Number)
      if (!isNaN(hours) && !isNaN(minutes)) {
        selectedDate.setHours(hours, minutes)
      } else if (!showTime) {
        const existing = date ?? new Date()
        selectedDate.setHours(existing.getHours(), existing.getMinutes())
      }
      setDate(selectedDate)
      onChange?.(selectedDate.toISOString())
    }
  }

  const handleTimeChange = (time: string) => {
    if (!showTime) return
    setTimeValue(time)
    if (date) {
      const [hours, minutes] = time.split(":").map(Number)
      if (!isNaN(hours) && !isNaN(minutes)) {
        const newDate = new Date(date)
        newDate.setHours(hours, minutes)
        setDate(newDate)
        onChange?.(newDate.toISOString())
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className={cn(
            "w-full justify-start text-left font-normal h-11 rounded-full border border-border bg-background px-4",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            showTime
              ? format(date, "yyyy년 MM월 dd일 HH:mm", { locale: ko })
              : format(date, "yyyy년 MM월 dd일", { locale: ko })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {showTime ? (
          <div className="p-3 border-b">
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={timeValue}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
        ) : null}
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
