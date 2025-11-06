"use client";

import { useState, useEffect } from "react";
import { usePets } from "@/hooks/usePets";
import type { Pet, VetInfo } from "@/lib/types";
import { useStorage } from "@/hooks/useStorage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, Loader2, UploadCloudIcon, CalendarIcon } from "lucide-react";
import imageCompression from 'browser-image-compression';
import Image from "next/image";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PetAddFormProps {
  isOpen?: boolean;
  onClose?: () => void;
  petToEdit?: Pet | null;
}

export function PetAddForm({
  isOpen: propIsOpen,
  onClose: propOnClose,
  petToEdit,
}: PetAddFormProps) {
  const { addPet, updatePet } = usePets();
  const { uploadImage, uploading, progress } = useStorage();
  const [formData, setFormData] = useState<Omit<Pet, "id">>({
    name: "",
    breed: "",
    birthday: "",
    gender: "other",
    adoptionDate: "",
    medicalNotes: "",
    profileImageUrl: "",
    microchipId: "",
    vetInfo: [],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isModalOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const closeModal =
    propOnClose !== undefined ? propOnClose : () => setInternalIsOpen(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const MAX_STEPS = 2;
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (isModalOpen) {
      if (petToEdit) {
        setFormData({
          name: petToEdit.name || "",
          breed: petToEdit.breed || "",
          birthday: petToEdit.birthday || "",
          gender: petToEdit.gender || "other",
          adoptionDate: petToEdit.adoptionDate || "",
          medicalNotes: petToEdit.medicalNotes || "",
          profileImageUrl: petToEdit.profileImageUrl || "",
          microchipId: petToEdit.microchipId || "",
          vetInfo: petToEdit.vetInfo || [],
        });
        if (petToEdit.profileImageUrl) {
          setImagePreview(petToEdit.profileImageUrl);
        }
      } else {
        setFormData({
          name: "",
          breed: "",
          birthday: "",
          gender: "other",
          adoptionDate: "",
          medicalNotes: "",
          profileImageUrl: "",
          microchipId: "",
          vetInfo: [],
        });
      }
      setValidationErrors({});
      setCurrentStep(0);
      setImageFile(null);
      setImagePreview(petToEdit?.profileImageUrl || null);
    }
  }, [isModalOpen, petToEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Option for image compression
      const options = {
        maxSizeMB: 0.25,        // (max file size in MB, aiming for 250KB)
        maxWidthOrHeight: 1024, // (max width or height in pixels)
        useWebWorker: true,     // (use web worker for faster compression)
        fileType: 'image/webp', // Convert to WebP for better compression
        quality: 0.8,           // Adjust quality (0 to 1, default is 0.75)
      };
      try {
        toast.info("画像を圧縮中...");
        const compressedFile = await imageCompression(file, options);
        toast.success("画像の圧縮が完了しました。");

        setImageFile(compressedFile);
        const previewUrl = URL.createObjectURL(compressedFile);
        setImagePreview(previewUrl);
      } catch (error) {
        console.error("画像圧縮に失敗しました:", error);
        toast.error("画像の圧縮に失敗しました。");
      }
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date ? format(date, "yyyy-MM-dd") : "",
    }));
  };

  const handleVetInfoChange = (
    index: number,
    field: keyof VetInfo,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      vetInfo:
        prev.vetInfo?.map((vet, i) =>
          i === index ? { ...vet, [field]: value } : vet
        ) || [],
    }));
  };

  const handleAddVetInfo = () => {
    if (formData.vetInfo && formData.vetInfo.length < 5) {
      setFormData((prev) => ({
        ...prev,
        vetInfo: [
          ...(prev.vetInfo || []),
          { id: generateUniqueId(), name: "", phone: "" },
        ],
      }));
    }
  };

  const handleRemoveVetInfo = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      vetInfo: prev.vetInfo?.filter((vet) => vet.id !== id) || [],
    }));
  };

  const validateStep = (step: number) => {
    const errors: Record<string, string> = {};
    if (step === 0) {
      if (!formData.name.trim()) {
        errors.name = "ペットの名前は必須です。";
      } else if (formData.name.length > 20) {
        errors.name = "ペットの名前は20文字以内で入力してください。";
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(MAX_STEPS)) {
      toast.error("入力内容に不備があります。ご確認ください。");
      return;
    }
    setIsSubmitting(true);

    const dataToSubmit = { ...formData };

    try {
      if (imageFile) {
        toast.info("画像をアップロード中...");
        const downloadURL = await uploadImage(imageFile);
        dataToSubmit.profileImageUrl = downloadURL;
      }

      if (petToEdit) {
        await updatePet(petToEdit.id, dataToSubmit);
        toast.success("ペット情報を更新しました！");
      } else {
        await addPet(dataToSubmit);
        toast.success("新しいペットを追加しました！");
      }
      closeModal();
    } catch (error) {
      console.error(error);
      toast.error("ペット情報の保存に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => {
        if (!open) closeModal();
        else setInternalIsOpen(true);
      }}
    >
      <DialogTrigger asChild>
        {!petToEdit && (
          <Button onClick={() => setInternalIsOpen(true)}>
            <PlusIcon className="mr-2 h-5 w-5" />
            新しいペットを追加
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {petToEdit ? "ペット情報を編集" : "新しいペットを追加"} (ステップ{" "}
            {currentStep + 1} / {MAX_STEPS + 1})
          </DialogTitle>
          <DialogDescription>
            ペットの情報を入力してください。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {currentStep === 0 && (
            <>
              <div>
                <Label htmlFor="name">名前 *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full"
                  maxLength={20} // Add maxLength attribute
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.name}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="breed">種類</Label>
                  <Input
                    id="breed"
                    name="breed"
                    value={formData.breed}
                    onChange={handleChange}
                    className="w-full"
                  />
                  {validationErrors.breed && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.breed}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="gender">性別</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("gender", value)
                    }
                    value={formData.gender}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="性別を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">男の子</SelectItem>
                      <SelectItem value="female">女の子</SelectItem>
                      <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.gender && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.gender}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="birthday">誕生日</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.birthday && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.birthday
                          ? format(
                              new Date(formData.birthday),
                              "yyyy年MM月dd日",
                              { locale: ja }
                            )
                          : "日付を選択"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          formData.birthday
                            ? new Date(formData.birthday)
                            : undefined
                        }
                        onSelect={(date) => handleDateChange("birthday", date)}
                        initialFocus
                        locale={ja}
                      />
                    </PopoverContent>
                  </Popover>
                  {validationErrors.birthday && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.birthday}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="adoptionDate">お迎え日</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.adoptionDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.adoptionDate
                          ? format(
                              new Date(formData.adoptionDate),
                              "yyyy年MM月dd日",
                              { locale: ja }
                            )
                          : "日付を選択"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          formData.adoptionDate
                            ? new Date(formData.adoptionDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          handleDateChange("adoptionDate", date)
                        }
                        initialFocus
                        locale={ja}
                      />
                    </PopoverContent>
                  </Popover>
                  {validationErrors.adoptionDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.adoptionDate}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <div>
                <Label>プロフィール画像</Label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="プレビュー"
                        width={96}
                        height={96}
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <UploadCloudIcon className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <Input
                    id="profileImageUrl"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full max-w-xs"
                    disabled={uploading}
                  />
                </div>
                {uploading && (
                  <p className="text-sm text-blue-500 mt-2">
                    アップロード中: {Math.round(progress)}%
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="medicalNotes">メモ</Label>
                <Textarea
                  id="medicalNotes"
                  name="medicalNotes"
                  value={formData.medicalNotes}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="健康に関するメモなど"
                />
              </div>
              <div>
                <Label htmlFor="microchipId">マイクロチップID</Label>
                <Input
                  id="microchipId"
                  name="microchipId"
                  value={formData.microchipId}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="マイクロチップID"
                />
              </div>
            </>
          )}

          {currentStep === 2 && (
            <div className="col-span-4 space-y-2 my-4">
              <Label>かかりつけ医情報 (最大5件)</Label>
              {formData.vetInfo &&
                formData.vetInfo.map((vet, index) => (
                  <div key={vet.id} className="space-y-2 border p-2 rounded">
                    <div>
                      <Label htmlFor={`vetName-${index}`}>名前</Label>
                      <Input
                        id={`vetName-${index}`}
                        name="name"
                        value={vet.name || ""}
                        onChange={(e) =>
                          handleVetInfoChange(index, "name", e.target.value)
                        }
                        className="w-full"
                        placeholder="病院名または医師名"
                      />
                      {validationErrors[`vetName-${index}`] && (
                        <p className="text-red-500 text-sm mt-1">
                          {validationErrors[`vetName-${index}`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`vetPhone-${index}`}>電話番号</Label>
                      <Input
                        id={`vetPhone-${index}`}
                        name="phone"
                        value={vet.phone || ""}
                        onChange={(e) =>
                          handleVetInfoChange(index, "phone", e.target.value)
                        }
                        className="w-full"
                        placeholder="電話番号"
                      />
                      {validationErrors[`vetPhone-${index}`] && (
                        <p className="text-red-500 text-sm mt-1">
                          {validationErrors[`vetPhone-${index}`]}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveVetInfo(vet.id)}
                      className="w-full"
                    >
                      削除
                    </Button>
                  </div>
                ))}
              {formData.vetInfo && formData.vetInfo.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddVetInfo}
                  className="w-full"
                >
                  かかりつけ医を追加
                </Button>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              disabled={isSubmitting}
            >
              戻る
            </Button>
          )}
          {currentStep < MAX_STEPS ? (
            <Button onClick={handleNext} disabled={isSubmitting}>
              次へ
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || uploading}
            >
              {isSubmitting || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? "アップロード中..." : "保存中..."}
                </>
              ) : (
                "保存"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function generateUniqueId() {
  return Date.now().toString();
}
