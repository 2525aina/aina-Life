'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePickerDropdown } from '@/components/ui/date-picker-dropdown';
import { cn } from '@/lib/utils';
import { StyledInput, SpeciesBreedSelector, GenderSelect, ColorSelect } from '@/components/ui/styled-form-fields';

export interface PetBasicInfoData {
    name: string;
    species: string;
    breed: string;
    color: string;
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

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold text-muted-foreground ml-1">名前 <span className="text-destructive">*</span></Label>
                    <StyledInput
                        id="name"
                        value={data.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="ペットの名前"
                        disabled={disabled}
                    />
                </div>

                <SpeciesBreedSelector
                    species={data.species}
                    breed={data.breed}
                    onChangeSpecies={(val) => onChange({ ...data, species: val, breed: '' })}
                    onChangeBreed={(val) => handleChange('breed', val)}
                    disabled={disabled}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground ml-1">性別</Label>
                        <GenderSelect
                            value={data.gender as any}
                            onChange={(val) => handleChange('gender', val)}
                            type="pet"
                            disabled={disabled}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground ml-1">毛色</Label>
                        <ColorSelect
                            value={data.color}
                            onChange={(val) => handleChange('color', val)}
                            disabled={disabled}
                        />
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
                        label="うちの子記念日"
                        date={data.adoptionDate}
                        setDate={(d) => handleChange('adoptionDate', d)}
                        disabled={disabled}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="microchipId" className="text-xs font-bold text-muted-foreground ml-1">マイクロチップID</Label>
                    <StyledInput
                        id="microchipId"
                        value={data.microchipId}
                        onChange={(e) => handleChange('microchipId', e.target.value)}
                        placeholder="マイクロチップID（任意）"
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
}
