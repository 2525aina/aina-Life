import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { SPECIES_DATA } from '@/lib/constants/species';
import { PET_COLORS } from '@/lib/constants/colors';
import { cn } from '@/lib/utils';

// ==========================================
// Styled Base Components
// ==========================================

interface StyledInputProps extends React.ComponentProps<typeof Input> { }

export const StyledInput = React.forwardRef<HTMLInputElement, StyledInputProps>(
    ({ className, ...props }, ref) => {
        return (
            <Input
                ref={ref}
                className={cn(
                    "h-12 rounded-xl bg-white/50 dark:bg-black/20 border-white/20 focus:scale-[1.01] transition-transform",
                    className
                )}
                {...props}
            />
        );
    }
);
StyledInput.displayName = 'StyledInput';

interface StyledSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    options?: { value: string; label: string; icon?: React.ReactNode }[];
    children?: React.ReactNode;
    disabled?: boolean;
    className?: string;
    triggerClassName?: string;
}

export const StyledSelect = ({ value, onValueChange, placeholder = "選択", options, children, disabled, className, triggerClassName }: StyledSelectProps) => {
    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger className={cn("h-12 rounded-xl bg-white/50 dark:bg-black/20 border-white/20", triggerClassName)}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className={cn("max-h-[300px]", className)}>
                {options ? options.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                            {opt.icon}
                            <span>{opt.label}</span>
                        </div>
                    </SelectItem>
                )) : children}
            </SelectContent>
        </Select>
    );
};

// ==========================================
// Domain Specific Components
// ==========================================

// --- Gender Selector ---
interface GenderSelectProps {
    value: string;
    onChange: (value: string) => void;
    type: 'human' | 'pet' | 'friend';
    disabled?: boolean;
}

export const GenderSelect = ({ value, onChange, type, disabled }: GenderSelectProps) => {
    const options = useMemo(() => {
        if (type === 'human') {
            return [
                { value: 'male', label: '男性' },
                { value: 'female', label: '女性' },
                { value: 'other', label: 'その他' },
            ];
        } else if (type === 'pet') {
            return [
                { value: 'male', label: '男の子 ♂' },
                { value: 'female', label: '女の子 ♀' },
                { value: 'other', label: 'その他' },
            ];
        } else {
            // friend
            return [
                { value: 'male', label: '男の子 (♂)' },
                { value: 'female', label: '女の子 (♀)' },
                { value: 'unknown', label: '不明' },
            ];
        }
    }, [type]);

    return (
        <StyledSelect
            value={value}
            onValueChange={onChange}
            options={options}
            disabled={disabled}
        />
    );
};

// --- Color Selector ---
interface ColorSelectProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export const ColorSelect = ({ value, onChange, disabled }: ColorSelectProps) => {
    return (
        <StyledSelect
            value={value}
            onValueChange={onChange}
            disabled={disabled}
        >
            {PET_COLORS.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                    <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                        {c.name}
                    </span>
                </SelectItem>
            ))}
        </StyledSelect>
    );
};

// --- Species & Breed Selector ---
interface SpeciesBreedSelectorProps {
    species: string;
    breed: string;
    onChangeSpecies: (species: string) => void;
    onChangeBreed: (breed: string) => void;
    disabled?: boolean;
}

export const SpeciesBreedSelector = ({ species, breed, onChangeSpecies, onChangeBreed, disabled }: SpeciesBreedSelectorProps) => {
    const speciesOptions = useMemo(() => [
        // 犬・猫
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
    ], []);

    const currentSpecies = speciesOptions.find(opt => opt.value === species);
    const breedOptions = currentSpecies?.breeds || [];
    const isOtherSpecies = species === 'other';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground ml-1">種類</Label>
                <StyledSelect
                    value={species}
                    onValueChange={(val) => {
                        onChangeSpecies(val);
                        // We do NOT call onChangeBreed('') here to avoid race conditions.
                        // The parent must handle the breed reset if desired.
                    }}
                    options={speciesOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                    disabled={disabled}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground ml-1">品種</Label>
                {!isOtherSpecies && breedOptions.length > 0 ? (
                    <StyledSelect
                        value={breed}
                        onValueChange={onChangeBreed}
                        disabled={disabled}
                    >
                        {breedOptions.map((b) => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                    </StyledSelect>
                ) : (
                    <StyledInput
                        value={breed}
                        onChange={(e) => onChangeBreed(e.target.value)}
                        placeholder="品種を入力"
                        disabled={disabled}
                    />
                )}
            </div>
        </div>
    );
};
