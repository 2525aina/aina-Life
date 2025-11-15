"use client";

import * as React from "react";
import { format, setHours, setMinutes, setSeconds } from "date-fns";
import { ja } from "date-fns/locale";
import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimePickerProps {
  selected: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholderText?: string;
  className?: string;
  id?: string;
  name?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  selected,
  onChange,
  placeholderText = "時刻を選択",
  className,
  id,
  name,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const seconds = Array.from({ length: 60 }, (_, i) => i); // Add seconds array

  const handleHourChange = (value: string) => {
    const hour = parseInt(value, 10);
    if (selected) {
      onChange(setHours(selected, hour));
    } else {
      onChange(setHours(setMinutes(setSeconds(new Date(), 0), 0), hour));
    }
  };

  const handleMinuteChange = (value: string) => {
    const minute = parseInt(value, 10);
    if (selected) {
      onChange(setMinutes(selected, minute));
    } else {
      onChange(setMinutes(setHours(setSeconds(new Date(), 0), 0), minute));
    }
  };

  const handleSecondChange = (value: string) => { // Add handleSecondChange
    const second = parseInt(value, 10);
    if (selected) {
      onChange(setSeconds(selected, second));
    } else {
      onChange(setSeconds(setMinutes(setHours(new Date(), 0), 0), second));
    }
  };

  const displayValue = selected ? format(selected, "HH:mm:ss", { locale: ja }) : placeholderText; // Update format

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
          <Clock className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="flex gap-2 p-2">
          <Select
            value={selected ? format(selected, "HH") : ""}
            onValueChange={handleHourChange}
          >
            <SelectTrigger className="w-[80px]" id="time-hour-select" name="time-hour-select">
              <SelectValue placeholder="時" />
            </SelectTrigger>
            <SelectContent>
              {hours.map((h) => (
                <SelectItem key={h} value={String(h).padStart(2, "0")}>
                  {String(h).padStart(2, "0")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selected ? format(selected, "mm") : ""}
            onValueChange={handleMinuteChange}
          >
            <SelectTrigger className="w-[80px]" id="time-minute-select" name="time-minute-select">
              <SelectValue placeholder="分" />
            </SelectTrigger>
            <SelectContent>
              {minutes.map((m) => (
                <SelectItem key={m} value={String(m).padStart(2, "0")}>
                  {String(m).padStart(2, "0")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select // Add Select for seconds
            value={selected ? format(selected, "ss") : ""}
            onValueChange={handleSecondChange}
          >
            <SelectTrigger className="w-[80px]" id="time-second-select" name="time-second-select">
              <SelectValue placeholder="秒" />
            </SelectTrigger>
            <SelectContent>
              {seconds.map((s) => (
                <SelectItem key={s} value={String(s).padStart(2, "0")}>
                  {String(s).padStart(2, "0")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
};
