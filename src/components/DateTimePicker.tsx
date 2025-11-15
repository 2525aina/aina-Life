"use client";

import * as React from "react";
import { format, setHours, setMinutes, setSeconds } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  selected: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholderText?: string;
  className?: string;
  id?: string;
  name?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selected,
  onChange,
  placeholderText = "日時を選択",
  className,
  id,
  name,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDateChange = (date: Date | undefined) => {
    if (date && selected) {
      // Preserve time if date changes
      onChange(setHours(setMinutes(setSeconds(date, selected.getSeconds()), selected.getMinutes()), selected.getHours()));
    } else {
      onChange(date);
    }
  };

  const handleTimeChange = (time: Date | undefined) => {
    if (time && selected) {
      // Preserve date if time changes
      onChange(setHours(setMinutes(setSeconds(selected, time.getSeconds()), time.getMinutes()), time.getHours()));
    } else {
      onChange(time);
    }
  };

  const displayValue = selected ? format(selected, "yyyy/MM/dd HH:mm:ss", { locale: ja }) : placeholderText;

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
        <div className="flex flex-col gap-2 p-2">
          <DatePicker
            selected={selected}
            onChange={handleDateChange}
            placeholderText="日付を選択"
          />
          <TimePicker
            selected={selected}
            onChange={handleTimeChange}
            placeholderText="時刻を選択"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
