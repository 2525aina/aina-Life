'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface TimePickerInputProps {
    time: string; // "HH:mm" format
    setTime: (time: string) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function TimePickerInput({
    time,
    setTime,
    label,
    placeholder = '00:00',
    disabled = false,
    className,
    size = 'md',
}: TimePickerInputProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [hours, minutes] = time ? time.split(':').map(Number) : [0, 0];

    const handleHourChange = (h: number) => {
        setTime(`${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    };

    const handleMinuteChange = (m: number) => {
        setTime(`${hours.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    };

    const sizeClasses = {
        sm: 'h-10 text-sm',
        md: 'h-12 text-base',
        lg: 'h-14 text-lg',
    };

    return (
        <div className={cn('space-y-2', className)}>
            {label && <Label className="text-xs font-bold text-muted-foreground ml-1">{label}</Label>}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                            'w-full justify-start text-left font-bold pl-3 pr-3 rounded-xl bg-white/50 dark:bg-black/20 border-white/20 hover:bg-white/60 dark:hover:bg-black/30 transition-all',
                            sizeClasses[size],
                            !time && 'text-muted-foreground font-normal'
                        )}
                    >
                        <Clock className="mr-2 h-4 w-4 opacity-70" />
                        <span className="font-mono tracking-wider">{time || placeholder}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4 rounded-2xl glass border-white/20" align="start">
                    <div className="flex items-center gap-4">
                        {/* Hours */}
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">時</span>
                            <div className="grid grid-cols-4 gap-1 max-h-[180px] overflow-y-auto custom-scrollbar p-1">
                                {Array.from({ length: 24 }, (_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleHourChange(i)}
                                        className={cn(
                                            'w-9 h-9 rounded-lg text-sm font-bold transition-all',
                                            hours === i
                                                ? 'bg-primary text-white shadow-md shadow-primary/30'
                                                : 'hover:bg-muted/50 text-foreground/80'
                                        )}
                                    >
                                        {i.toString().padStart(2, '0')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <span className="text-2xl font-black text-muted-foreground/50">:</span>

                        {/* Minutes */}
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">分</span>
                            <div className="grid grid-cols-4 gap-1 max-h-[180px] overflow-y-auto custom-scrollbar p-1">
                                {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => handleMinuteChange(m)}
                                        className={cn(
                                            'w-9 h-9 rounded-lg text-sm font-bold transition-all',
                                            minutes === m
                                                ? 'bg-primary text-white shadow-md shadow-primary/30'
                                                : 'hover:bg-muted/50 text-foreground/80'
                                        )}
                                    >
                                        {m.toString().padStart(2, '0')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                        <Button
                            size="sm"
                            className="rounded-full gradient-primary px-6"
                            onClick={() => setIsOpen(false)}
                        >
                            完了
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
