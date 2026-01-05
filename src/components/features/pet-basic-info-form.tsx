'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDropdown } from '@/components/ui/date-picker-dropdown';
import { cn } from '@/lib/utils';
import { SPECIES_DATA } from '@/lib/constants/species';
import { PET_COLORS } from '@/lib/constants/colors';

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

    // 種類オプションの生成
    const speciesOptions = [
        // 犬・猫 (Use species keys for compatibility with friends/new)
        { label: SPECIES_DATA.mammals.categories.dogs.label, value: SPECIES_DATA.mammals.categories.dogs.species, breeds: SPECIES_DATA.mammals.categories.dogs.breeds },
        { label: SPECIES_DATA.mammals.categories.cats.label, value: SPECIES_DATA.mammals.categories.cats.species, breeds: SPECIES_DATA.mammals.categories.cats.breeds },
        // 小動物
        ...Object.values(SPECIES_DATA.mammals.categories.small_mammals.categories).map(c => ({ label: c.label, value: c.label, breeds: c.breeds })),
        // 鳥類
        ...Object.values(SPECIES_DATA.birds.categories).map(c => ({ label: c.label, value: c.label, breeds: c.breeds })),
        // 爬虫類
        ...Object.values(SPECIES_DATA.reptiles.categories).map(c => ({ label: c.label, value: c.label, breeds: c.breeds })),
        // 両生類
        ...Object.values(SPECIES_DATA.amphibians.categories).map(c => ({ label: c.label, value: c.label, breeds: c.breeds })),
        // 魚類
        ...Object.values(SPECIES_DATA.fish.categories).map(c => ({ label: c.label, value: c.label, breeds: c.breeds })),
        // 無脊椎動物
        ...Object.values(SPECIES_DATA.invertebrates.categories).map(c => ({ label: c.label, value: c.label, breeds: c.breeds })),
        // その他
        { label: 'その他', value: 'other', breeds: [] }
    ];

    // 選択された種類に基づく品種オプションの取得
    const currentSpecies = speciesOptions.find(opt => opt.value === data.species);
    const breedOptions = currentSpecies?.breeds || [];
    const isOtherSpecies = data.species === 'other';

    return (
        <div className={cn("glass rounded-[2.5rem] p-8 shadow-xl space-y-6 relative overflow-hidden", className)}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary opacity-50" />

            <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <h3 className="font-bold text-lg text-foreground/80">基本情報</h3>
            </div>

            <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold text-muted-foreground ml-1">名前 <span className="text-destructive">*</span></Label>
                <DatePickerDropdown
                    label="うちの子記念日"
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
