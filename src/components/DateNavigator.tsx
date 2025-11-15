"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/DatePicker';
import { subDays, addDays, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';

interface DateNavigatorProps {
  onDateChange: (date: Date) => void;
}

export function DateNavigator({ onDateChange }: DateNavigatorProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    onDateChange(currentDate);
  }, [currentDate, onDateChange]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant="outline" size="icon" onClick={() => setCurrentDate(subDays(currentDate, 1))}><ChevronLeft className="h-4 w-4" /></Button>
      <div className="">
        <DatePicker selected={currentDate} onChange={setCurrentDate} />
      </div>
      <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date())} disabled={isToday(currentDate)}><CalendarClock className="h-4 w-4" /></Button>
      <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 1))}><ChevronRight className="h-4 w-4" /></Button>
    </div>
  );
}
