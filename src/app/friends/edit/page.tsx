'use client';

import { AppLayout } from '@/components/features/AppLayout';
import { usePetContext } from '@/contexts/PetContext';
import { useMembers } from '@/hooks/useMembers';
import { useFriends, useFriend } from '@/hooks/useFriends';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDropdown } from '@/components/ui/date-picker-dropdown';
import { SPECIES_DATA } from '@/lib/constants/species';
import { PET_COLORS } from '@/lib/constants/colors';
import { useState, useMemo, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Camera, Loader2, MapPin, User, Phone, Home, X } from 'lucide-react';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ImageCropper } from '@/components/ui/image-cropper';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

function EditFriendContent() {
    const { selectedPet } = usePetContext();
    const { canEdit } = useMembers(selectedPet?.id || null);
    const { updateFriend } = useFriends(selectedPet?.id || null);
    const { uploadImage, uploading } = useImageUpload();
    const router = useRouter();
    const searchParams = useSearchParams();
    const friendId = searchParams.get('id');
    const { friend, loading: friendLoading } = useFriend(selectedPet?.id || null, friendId || '');

    // Basic Info
    const [name, setName] = useState('');
    const [species, setSpecies] = useState('Canis lupus familiaris');
    const [breed, setBreed] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'unknown'>('unknown');
    const [color, setColor] = useState('');

    // Age/Birthday Logic
    const [birthdayMode, setBirthdayMode] = useState<'birthday' | 'age'>('birthday');
    const [birthday, setBirthday] = useState<Date | undefined>(undefined);
    const [ageYears, setAgeYears] = useState('');
    const [ageMonths, setAgeMonths] = useState('');

    // Calculate birthday from age when in age mode
    const calculatedBirthday = useMemo(() => {
        if (birthdayMode !== 'age') return undefined;
        if (!ageYears && !ageMonths) return undefined;

        const now = new Date();
        const years = parseInt(ageYears || '0');
        const months = parseInt(ageMonths || '0');

        // Simple calculation: subtract years and months from now
        const d = new Date(now);
        d.setFullYear(d.getFullYear() - years);
        d.setMonth(d.getMonth() - months);
        return d;
    }, [birthdayMode, ageYears, ageMonths]);

    const [weight, setWeight] = useState('');
    const [weightUnit, setWeightUnit] = useState<'kg' | 'g'>('kg');

    // Meeting Info
    const [metAt, setMetAt] = useState<Date>(new Date());
    const [location, setLocation] = useState('');
    const [memo, setMemo] = useState('');

    // Owner Info
    const [ownerName, setOwnerName] = useState('');
    const [ownerDetails, setOwnerDetails] = useState('');
    const [contact, setContact] = useState('');
    const [address, setAddress] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Image Cropper State
    const [cropperOpen, setCropperOpen] = useState(false);
    const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
    const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Dynamic Species Logic (Flattened for selection but grouped by category if we had better UI, here simple mapping)
    const speciesOptions = useMemo(() => {
        // Build options from constants
        const opts = [];
        if (SPECIES_DATA.mammals) {
            opts.push({ value: "Canis lupus familiaris", label: "犬" });
            opts.push({ value: "Felis catus", label: "猫" });
            // Add other mammals? We can iterate if needed, but primary use is Dog/Cat
        }
        opts.push({ value: "other", label: "その他" });
        return opts;
    }, []);

    const breedOptions = useMemo(() => {
        if (species === 'Canis lupus familiaris') return SPECIES_DATA.mammals.categories.dogs.breeds;
        if (species === 'Felis catus') return SPECIES_DATA.mammals.categories.cats.breeds;
        // For others, we might want to show lists from other categories, but kept simple for now or "Others"
        return [];
    }, [species]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setOriginalImageSrc(url);
            setCropperOpen(true);
            e.target.value = '';
        }
    };

    const handleCropComplete = (croppedBlob: Blob) => {
        const file = new File([croppedBlob], "friend_image.jpg", { type: "image/jpeg" });
        setPendingImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setCropperOpen(false);
    };

    const handleCropCancel = () => {
        setCropperOpen(false);
        if (!pendingImageFile) {
            setOriginalImageSrc(null);
        }
    };

    const handleRemoveImage = () => {
        setPendingImageFile(null);
        setPreviewUrl(null);
        setOriginalImageSrc(null); // Assuming reset to no image means clearing
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Populate form with existing data
    useEffect(() => {
        if (friend) {
            setName(friend.name);
            setSpecies(friend.species || 'Canis lupus familiaris');
            setBreed(friend.breed || '');
            setGender(friend.gender || 'unknown');
            setColor(friend.color || '');

            if (friend.metAt) setMetAt(friend.metAt.toDate());
            if (friend.birthday) {
                setBirthday(friend.birthday.toDate());
                setBirthdayMode('birthday');
            }
            if (friend.weight) setWeight(friend.weight.toString());
            if (friend.weightUnit) setWeightUnit(friend.weightUnit);

            setOwnerName(friend.ownerName || '');
            setOwnerDetails(friend.ownerDetails || '');
            setContact(friend.contact || '');
            setAddress(friend.address || '');
            setLocation(friend.location || '');
            setMemo(friend.features || '');

            if (friend.images && friend.images.length > 0) {
                setPreviewUrl(friend.images[0]);
            }
        }
    }, [friend]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPet || !canEdit || !friendId) return;
        if (!name) { toast.error('名前を入力してください'); return; }

        setIsSubmitting(true);
        try {
            let imageUrl = previewUrl || '';
            // If new file selected, upload it
            if (pendingImageFile) {
                imageUrl = await uploadImage(pendingImageFile, `pets/${selectedPet.id}/friends`, {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    fileType: 'image/webp'
                });
            }

            const updateData: any = {
                name,
                species,
                breed,
                gender,
                color,
                location,
                features: memo,
                metAt: metAt,
                birthday: birthdayMode === 'age'
                    ? (calculatedBirthday ? Timestamp.fromDate(calculatedBirthday) : undefined)
                    : (birthday ? Timestamp.fromDate(birthday) : undefined),
                weight: weight ? parseFloat(weight) : undefined,
                weightUnit: weight ? weightUnit : undefined,
                ownerName,
                ownerDetails,
                contact,
                address,
            };

            if (imageUrl) {
                updateData.images = [imageUrl];
            }

            await updateFriend(friendId, updateData);

            toast.success('情報を更新しました！');
            router.push(`/friends/detail?id=${friendId}`);
        } catch (e) {
            console.error(e);
            toast.error('更新に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!canEdit) return <AppLayout><div>権限がありません</div></AppLayout>;
    if (friendLoading) return <AppLayout><div className="p-8 text-center">読み込み中...</div></AppLayout>;

    if (!canEdit) return <AppLayout><div>権限がありません</div></AppLayout>;

    return (
        <AppLayout>
            <div className="relative min-h-screen pb-32">
                <div className="absolute inset-0 h-[30vh] bg-gradient-to-b from-primary/10 to-transparent -z-10" />

                <div className="px-4 pt-6 space-y-6 max-w-lg mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/friends">
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20">
                                <ArrowLeft className="w-6 h-6" />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold">友達情報の編集</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Image Upload */}
                        <div className="flex justify-center">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden bg-muted border-4 border-white shadow-xl ring-1 ring-primary/10 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-white/50">
                                            <Camera className="w-10 h-10 opacity-50" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-32 h-32 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                {previewUrl && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveImage();
                                        }}
                                        className="absolute top-0 right-0 bg-destructive text-white p-1 rounded-full shadow-lg hover:bg-destructive/90 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Basic Info Section */}
                        <section className="space-y-4">
                            <h2 className="text-sm font-bold text-muted-foreground border-b pb-1">基本情報</h2>
                            <div className="space-y-2">
                                <Label htmlFor="name">お名前 <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="ポチ"
                                    className="bg-background/50 h-12 text-lg font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>種類</Label>
                                    <Select value={species} onValueChange={setSpecies}>
                                        <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {speciesOptions.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>犬種/猫種</Label>
                                    {breedOptions.length > 0 ? (
                                        <Select value={breed} onValueChange={setBreed}>
                                            <SelectTrigger className="bg-background/50"><SelectValue placeholder="選択" /></SelectTrigger>
                                            <SelectContent className="max-h-[200px]">
                                                {breedOptions.map(b => (
                                                    <SelectItem key={b} value={b}>{b}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input value={breed} onChange={e => setBreed(e.target.value)} placeholder="種類を入力" className="bg-background/50" />
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>性別</Label>
                                    <Select value={gender} onValueChange={(v: any) => setGender(v)}>
                                        <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">男の子 (♂)</SelectItem>
                                            <SelectItem value="female">女の子 (♀)</SelectItem>
                                            <SelectItem value="unknown">不明</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>毛色</Label>
                                    <Select value={color} onValueChange={setColor}>
                                        <SelectTrigger className="bg-background/50"><SelectValue placeholder="選択" /></SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            {PET_COLORS.map(c => (
                                                <SelectItem key={c.id} value={c.name}>
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                                                        {c.name}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>年齢・誕生日</Label>
                                <div className="space-y-4">
                                    <div className="flex bg-muted/50 p-1 rounded-lg">
                                        <button
                                            type="button"
                                            className={`flex-1 py-1.5 text-sm rounded-md transition-all ${birthdayMode === 'birthday' ? 'bg-background shadow-sm font-bold text-primary' : 'text-muted-foreground'}`}
                                            onClick={() => setBirthdayMode('birthday')}
                                        >
                                            誕生日を指定
                                        </button>
                                        <button
                                            type="button"
                                            className={`flex-1 py-1.5 text-sm rounded-md transition-all ${birthdayMode === 'age' ? 'bg-background shadow-sm font-bold text-primary' : 'text-muted-foreground'}`}
                                            onClick={() => setBirthdayMode('age')}
                                        >
                                            年齢から計算
                                        </button>
                                    </div>

                                    {birthdayMode === 'birthday' ? (
                                        <DatePickerDropdown
                                            date={birthday}
                                            setDate={setBirthday}
                                            label="誕生日"
                                            toDate={new Date()}
                                        />
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs">何歳？</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={ageYears}
                                                        onChange={e => setAgeYears(e.target.value)}
                                                        className="bg-background/50 pr-8"
                                                    />
                                                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">歳</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">何ヶ月？</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="11"
                                                        value={ageMonths}
                                                        onChange={e => setAgeMonths(e.target.value)}
                                                        className="bg-background/50 pr-8"
                                                    />
                                                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">ヶ月</span>
                                                </div>
                                            </div>
                                            <p className="col-span-2 text-xs text-muted-foreground text-center">
                                                推定誕生日: {calculatedBirthday ? format(calculatedBirthday, 'yyyy/M/d') : '---'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>体重</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={weight}
                                        onChange={e => setWeight(e.target.value)}
                                        placeholder="0.0"
                                        className="bg-background/50"
                                    />
                                    <Select value={weightUnit} onValueChange={(v: any) => setWeightUnit(v)}>
                                        <SelectTrigger className="w-20 bg-background/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="kg">kg</SelectItem>
                                            <SelectItem value="g">g</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </section>

                        {/* Owner Info Section */}
                        <section className="space-y-4">
                            <h2 className="text-sm font-bold text-muted-foreground border-b pb-1 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                飼い主情報
                            </h2>
                            <div className="space-y-2">
                                <Label>飼い主名</Label>
                                <Input value={ownerName} onChange={e => setOwnerName(e.target.value)} className="bg-background/50" placeholder="○○さん" />
                            </div>
                            <div className="space-y-2">
                                <Label>飼い主の特徴</Label>
                                <Input value={ownerDetails} onChange={e => setOwnerDetails(e.target.value)} className="bg-background/50" placeholder="いつも帽子を被っている、など" />
                            </div>
                            <div className="space-y-2">
                                <Label>連絡先</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input value={contact} onChange={e => setContact(e.target.value)} className="pl-9 bg-background/50" placeholder="電話番号やLINEなど（任意）" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>住所・地域</Label>
                                <div className="relative">
                                    <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input value={address} onChange={e => setAddress(e.target.value)} className="pl-9 bg-background/50" placeholder="○○区○○町" />
                                </div>
                            </div>
                        </section>

                        {/* Meeting Info Section */}
                        <section className="space-y-4">
                            <h2 className="text-sm font-bold text-muted-foreground border-b pb-1">出会いの記録</h2>
                            <div className="grid grid-cols-1 gap-4">
                                <DatePickerDropdown
                                    date={metAt}
                                    setDate={d => d && setMetAt(d)}
                                    label="出会った日"
                                    toDate={new Date()}
                                />

                                <div className="space-y-2">
                                    <Label>出会った場所</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={location}
                                            onChange={e => setLocation(e.target.value)}
                                            placeholder="公園、ドッグランなど"
                                            className="pl-9 bg-background/50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>特徴・メモ</Label>
                                    <textarea
                                        value={memo}
                                        onChange={e => setMemo(e.target.value)}
                                        placeholder="フレンドリー、おやつが好き、など"
                                        className="w-full bg-background/50 min-h-[100px] rounded-xl border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="sticky bottom-24 z-20 pt-4 mx-auto max-w-sm">
                            <Button
                                type="submit"
                                disabled={isSubmitting || uploading}
                                className="rounded-full gradient-primary shadow-2xl w-full h-14 text-lg font-bold hover:scale-105 active:scale-95 transition-all"
                            >
                                {(isSubmitting || uploading) ? (
                                    <>
                                        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                        更新中...
                                    </>
                                ) : (
                                    '更新する'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
            <ImageCropper
                open={cropperOpen}
                imageSrc={originalImageSrc}
                onCropComplete={handleCropComplete}
                onCancel={handleCropCancel}
            />
        </AppLayout>
    );
}

export default function EditFriendPage() {
    return (
        <Suspense fallback={<AppLayout><div className="p-8 text-center">読み込み中...</div></AppLayout>}>
            <EditFriendContent />
        </Suspense>
    );
}
