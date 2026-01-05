'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDropdown } from '@/components/ui/date-picker-dropdown';
import { cn } from '@/lib/utils';

export interface PetBasicInfoData {
    name: string;
    breed: string;
    gender: 'male' | 'female' | 'other' | '';
    birthday: Date | undefined;
    adoptionDate: Date | undefined;
    microchipId: string;
}

interface PetBasicInfoFormProps {
    data: PetBasicInfoData;
    onChange: (data: PetBasicInfoData) => void;
    disabled?: boolean;
    className?: string;
}

export function PetBasicInfoForm({ data, onChange, disabled = false, className }: PetBasicInfoFormProps) {
    const handleChange = (field: keyof PetBasicInfoData, value: any) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className={cn("glass rounded-[2.5rem] p-8 shadow-xl space-y-6 relative overflow-hidden", className)}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary opacity-50" />

            <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <h3 className="font-bold text-lg text-foreground/80">基本情報</h3>
            </div>

            <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold text-muted-foreground ml-1">名前 <span className="text-destructive">*</span></Label>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="ペットの名前"
                    maxLength={20}
                    className="h-12 rounded-xl bg-white/50 dark:bg-black/20 border-white/20 focus:scale-[1.01] transition-transform"
                    disabled={disabled}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="breed" className="text-xs font-bold text-muted-foreground ml-1">品種</Label>
                    <Input
                        id="breed"
                        value={data.breed}
                        onChange={(e) => handleChange('breed', e.target.value)}
                        placeholder="例：柴犬"
                        className="h-12 rounded-xl bg-white/50 dark:bg-black/20 border-white/20"
                        disabled={disabled}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground ml-1">性別</Label>
                    <Select value={data.gender} onValueChange={(val) => handleChange('gender', val)} disabled={disabled}>
                        <SelectTrigger className="h-12 rounded-xl bg-white/50 dark:bg-black/20 border-white/20">
                            <SelectValue placeholder="選択" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">男の子 ♂</SelectItem>
                            <SelectItem value="female">女の子 ♀</SelectItem>
                            <SelectItem value="other">その他</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DatePickerDropdown
                    label="誕生日"
                    date={data.birthday}
                    setDate={(d) => handleChange('birthday', d)}
                    disabled={disabled}
                />

                <DatePickerDropdown
                    label="お迎え日"
                    date={data.adoptionDate}
                    setDate={(d) => handleChange('adoptionDate', d)}
                    disabled={disabled}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="microchipId" className="text-xs font-bold text-muted-foreground ml-1">マイクロチップID</Label>
                <Input
                    id="microchipId"
                    value={data.microchipId}
                    onChange={(e) => handleChange('microchipId', e.target.value)}
                    placeholder="マイクロチップID（任意）"
                    className="h-12 rounded-xl bg-white/50 dark:bg-black/20 border-white/20"
                    disabled={disabled}
                />
            </div>
        </div>
    );
}
