'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { EntryForm } from '@/components/features/EntryForm';
import { Entry } from '@/lib/types';

interface EntryEditSheetProps {
    entry: Entry | null;
    open: boolean;
    onClose: () => void;
    onSave: (entryId: string, data: any) => Promise<void>;
    isSubmitting: boolean;
}

export function EntryEditSheet({
    entry,
    open,
    onClose,
    onSave,
    isSubmitting,
}: EntryEditSheetProps) {
    if (!entry) return null;

    const handleSubmit = async (data: any) => {
        await onSave(entry.id, data);
        onClose();
    };

    return (
        <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl bg-background/95 backdrop-blur-xl border-t border-white/20 p-0 overflow-hidden">
                {/* Header */}
                <SheetHeader className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-white/10 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-9 h-9">
                            <X className="w-5 h-5" />
                        </Button>
                        <SheetTitle className="text-sm font-bold">編集</SheetTitle>
                        <div className="w-9" /> {/* Spacer */}
                    </div>
                </SheetHeader>

                {/* Content - EntryForm */}
                <div className="overflow-y-auto h-full">
                    <EntryForm
                        initialData={entry}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        title="編集"
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
