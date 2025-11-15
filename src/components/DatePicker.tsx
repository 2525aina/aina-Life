"use client";

import * as React from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  selected: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholderText?: string;
  className?: string;
  id?: string;
  name?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selected,
  onChange,
  placeholderText = "日付を選択",
  className,
  id,
  name,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate && selected) {
      // Preserve time from the old selected date
      newDate.setHours(selected.getHours());
      newDate.setMinutes(selected.getMinutes());
      newDate.setSeconds(selected.getSeconds());
      onChange(newDate);
    } else {
      onChange(newDate);
    }
    setIsOpen(false); // Close popover after selection
  };

  const displayValue = selected ? format(selected, "yyyy/MM/dd", { locale: ja }) : placeholderText;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
          id={id}
          name={name}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          locale={ja}
          mode="single"
          selected={selected}
          onSelect={handleDateSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
