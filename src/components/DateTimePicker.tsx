"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

import { ja } from 'date-fns/locale';

interface DateTimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  onOpenChange?: (open: boolean) => void;
  isManuallySet: boolean;
  setIsManuallySet: (isManuallySet: boolean) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DateTimePicker({ date, setDate, onOpenChange, isManuallySet, setIsManuallySet }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState(format(date, 'HH:mm:ss'));

  useEffect(() => {
    setTime(format(date, 'HH:mm:ss'));
  }, [date]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    const [hours, minutes, seconds] = time.split(':').map(Number);
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hours,
      minutes,
      seconds
    );
    setDate(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);
    // Robustly parse hours, minutes, and seconds
    const timeParts = newTime.split(':').map(part => parseInt(part, 10));
    const hours = timeParts[0] || 0;
    const minutes = timeParts[1] || 0;
    const seconds = timeParts[2] || 0; // Default to 0 if seconds are not provided

    const newDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
      seconds
    );
    setDate(newDate);
  };

  const handleReset = () => {
    setDate(new Date());
    setTime(format(new Date(), 'HH:mm:ss'));
    setIsManuallySet(false);
  };

  const handleOk = () => {
    setIsManuallySet(true);
    handleOpenChange(false);
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(date, 'yyyy/MM/dd HH:mm:ss')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          locale={ja}
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="p-4 border-t">
          <Input
            id="time-input"
            name="time-input"
            type="time"
            step="1"
            value={time}
            onChange={handleTimeChange}
          />
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={handleReset}>リセット</Button>
          <Button onClick={handleOk}>OK</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
