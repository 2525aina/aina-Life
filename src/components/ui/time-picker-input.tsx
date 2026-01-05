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

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;

function WheelColumn({
    items,
    value,
    onChange,
    label,
}: {
    items: number[];
    value: number;
    onChange: (v: number) => void;
    label: string;
}) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const isScrollingRef = React.useRef(false);
    const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Scroll to initial value on mount
    React.useEffect(() => {
        if (containerRef.current) {
            const index = items.indexOf(value);
            if (index !== -1) {
                containerRef.current.scrollTop = index * ITEM_HEIGHT;
            }
        }
    }, []);

    const handleScroll = () => {
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        isScrollingRef.current = true;

        scrollTimeoutRef.current = setTimeout(() => {
            if (containerRef.current) {
                const scrollTop = containerRef.current.scrollTop;
                const index = Math.round(scrollTop / ITEM_HEIGHT);
                const clampedIndex = Math.max(0, Math.min(items.length - 1, index));

                // Snap to position
                containerRef.current.scrollTo({
                    top: clampedIndex * ITEM_HEIGHT,
                    behavior: 'smooth',
                });

                onChange(items[clampedIndex]);
                isScrollingRef.current = false;
            }
        }, 100);
    };

    const handleItemClick = (item: number, index: number) => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: index * ITEM_HEIGHT,
                behavior: 'smooth',
            });
            onChange(item);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {label}
            </span>
            <div className="relative">
                {/* Selection highlight */}
                <div
                    className="absolute left-0 right-0 bg-primary/10 rounded-lg pointer-events-none z-0"
                    style={{
                        top: ITEM_HEIGHT * 2,
                        height: ITEM_HEIGHT,
                    }}
                />

                {/* Gradient overlays */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

                <div
                    ref={containerRef}
                    onScroll={handleScroll}
                    className="overflow-y-auto scrollbar-hide"
                    style={{
                        height: ITEM_HEIGHT * VISIBLE_ITEMS,
                        scrollSnapType: 'y mandatory',
                    }}
                >
                    {/* Top padding */}
                    <div style={{ height: ITEM_HEIGHT * 2 }} />

                    {items.map((item, index) => {
                        const isSelected = item === value;
                        return (
                            <button
                                key={item}
                                type="button"
                                onClick={() => handleItemClick(item, index)}
                                className={cn(
                                    'w-16 flex items-center justify-center text-lg font-bold transition-all',
                                    isSelected
                                        ? 'text-primary scale-110'
                                        : 'text-muted-foreground/50 hover:text-muted-foreground'
                                )}
                                style={{
                                    height: ITEM_HEIGHT,
                                    scrollSnapAlign: 'center',
                                }}
                            >
                                {item.toString().padStart(2, '0')}
                            </button>
                        );
                    })}

                    {/* Bottom padding */}
                    <div style={{ height: ITEM_HEIGHT * 2 }} />
                </div>
            </div>
        </div>
    );
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

    const hourItems = Array.from({ length: 24 }, (_, i) => i);
    const minuteItems = Array.from({ length: 60 }, (_, i) => i);

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
                <PopoverContent className="w-auto p-6 rounded-2xl glass border-white/20" align="start">
                    <div className="flex items-center gap-2">
                        <WheelColumn
                            items={hourItems}
                            value={hours}
                            onChange={handleHourChange}
                            label="時"
                        />

                        <span className="text-3xl font-black text-primary/50 mt-6">:</span>

                        <WheelColumn
                            items={minuteItems}
                            value={minutes}
                            onChange={handleMinuteChange}
                            label="分"
                        />
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
