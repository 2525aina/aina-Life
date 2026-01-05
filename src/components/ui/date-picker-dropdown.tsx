'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface DatePickerDropdownProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    fromDate?: Date;
    toDate?: Date;
    className?: string;
}

export function DatePickerDropdown({
    date,
    setDate,
    label,
    placeholder = '選択',
    disabled = false,
    fromDate,
    toDate = new Date(),
    className,
}: DatePickerDropdownProps) {
    return (
        <div className={cn('space-y-2', className)}>
            {label && <Label className="text-xs font-bold text-muted-foreground ml-1">{label}</Label>}
            <div className="relative">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            disabled={disabled}
                            className={cn(
                                'w-full h-12 justify-start text-left font-normal pl-3 pr-10 rounded-xl bg-white/50 dark:bg-black/20 border-white/20',
                                !date && 'text-muted-foreground'
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, 'yyyy/MM/dd', { locale: ja }) : placeholder}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            locale={ja}
                            captionLayout="dropdown"
                            fromDate={fromDate || new Date(1950, 0, 1)}
                            toDate={toDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                {date && !disabled && (
                    <div className="absolute right-1 top-1 bottom-0 mt-1 flex items-center">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                                e.stopPropagation();
                                setDate(undefined);
                            }}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
