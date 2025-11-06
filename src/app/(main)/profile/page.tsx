"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Loader2, LogOutIcon } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import type { UserProfile } from "@/lib/types";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { usePets } from "@/hooks/usePets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { AccountLinker } from "@/components/ui/AccountLinker";
import { TaskLoggerSettings } from "@/components/TaskLoggerSettings";
import { useStorage } from "@/hooks/useStorage"; // Import useStorage
import imageCompression from 'browser-image-compression'; // Import imageCompression
import Image from "next/image"; // Import Image component
import { UploadCloudIcon } from "lucide-react"; // Import UploadCloudIcon

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const {
    userProfile,
    loading: userProfileLoading,
    updateUserProfile,
  } = useUser();
  const { pets, loading: petsLoading } = usePets();
  const router = useRouter();
  const { uploadImage, uploading, progress } = useStorage(); // Initialize useStorage
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null); // State for the selected image file
  const [imagePreview, setImagePreview] = useState<string | null>(null); // State for image preview URL
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
    if (userProfile) {
      setFormData({
        nickname: userProfile.nickname || "",
        profileImageUrl: userProfile.profileImageUrl || "",
        birthday: userProfile.birthday || "",
        gender: userProfile.gender || "other",
        introduction: userProfile.introduction || "",
        primaryPetId: userProfile.primaryPetId || "",
        settings: {
          ...userProfile.settings,
          logDisplayColors: {
            creatorNameBg:
              userProfile.settings?.logDisplayColors?.creatorNameBg ||
              "#e5e7eb",
            creatorNameText:
              userProfile.settings?.logDisplayColors?.creatorNameText ||
              "#6b7280",
            timeBg: userProfile.settings?.logDisplayColors?.timeBg || "#e5e7eb",
            timeText:
              userProfile.settings?.logDisplayColors?.timeText || "#4b5563",
            deletedTaskBg:
              userProfile.settings?.logDisplayColors?.deletedTaskBg ||
              "#e5e7eb",
            deletedTaskText:
              userProfile.settings?.logDisplayColors?.deletedTaskText ||
              "#9ca3af",
            enabled: userProfile.settings?.logDisplayColors?.enabled ?? true,
          },
          timeFormat: userProfile.settings?.timeFormat || "HH:mm:ss",
          toastPosition: userProfile.settings?.toastPosition || "top-center",
          taskLogger: {
            showDateTime: userProfile.settings?.taskLogger?.showDateTime ?? true,
            showMemo: userProfile.settings?.taskLogger?.showMemo ?? true,
            initialDateTimeOpen: userProfile.settings?.taskLogger?.initialDateTimeOpen ?? true,
            initialMemoOpen: userProfile.settings?.taskLogger?.initialMemoOpen ?? true,
          },
        },
      });
      setImagePreview(userProfile.profileImageUrl || null); // Set image preview
    }
  }, [authLoading, user, router, userProfile, pets]);

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
      const options = {
        maxSizeMB: 0.25,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/webp',
        quality: 0.8,
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
    setFormData((prev) => {
      if (name.includes(".")) {
        const [parent, child] = name.split(".");
        return {
          ...prev,
          [parent]: {
            ...(prev[parent as keyof Partial<UserProfile>] as object),
            [child]: value,
          },
        };
      } else {
        return { ...prev, [name]: value };
      }
    });
  };

  const handleTaskLoggerSettingsChange = (newSettings: Partial<UserProfile['settings']['taskLogger']>) => {
    setFormData(prev => {
      const currentSettings = prev.settings || {
        notifications: { dailySummary: false },
        theme: "system",
        logDisplayColors: {
          enabled: true,
          creatorNameBg: "#e5e7eb",
          creatorNameText: "#6b7280",
          timeBg: "#e5e7eb",
          timeText: "#4b5563",
          deletedTaskBg: "#e5e7eb",
          deletedTaskText: "#9ca3af",
        },
        toastPosition: "bottom-right",
        timeFormat: "HH:mm:ss",
        taskLogger: {
          showDateTime: true,
          showMemo: true,
          initialDateTimeOpen: true,
          initialMemoOpen: true,
        },
      };

      const currentTaskLoggerSettings = currentSettings.taskLogger || {
        showDateTime: true,
        showMemo: true,
        initialDateTimeOpen: true,
        initialMemoOpen: true,
      };

      return {
        ...prev,
        settings: {
          ...currentSettings,
          taskLogger: {
            ...currentTaskLoggerSettings,
            ...newSettings,
          },
        },
      };
    });
  };

  const handleChangeColor = (
    category: "creatorName" | "time" | "deletedTask",
    type: "Bg" | "Text",
    value: string
  ) => {
    setFormData((prev) => {
      const currentSettings = prev.settings || {
        notifications: { dailySummary: false },
        theme: "system",
        logDisplayColors: {},
        toastPosition: "bottom-right",
      };
      const currentLogDisplayColors = currentSettings.logDisplayColors || {};
      return {
        ...prev,
        settings: {
          ...currentSettings,
          logDisplayColors: {
            ...currentLogDisplayColors,
            [`${category}${type}`]: value,
          },
        },
      };
    });
  };

  const handleToggleChange = (checked: boolean) => {
    setFormData((prev) => {
      const currentSettings = prev.settings || {
        notifications: { dailySummary: false },
        theme: "system",
        logDisplayColors: {},
        toastPosition: "bottom-right",
      };
      const currentLogDisplayColors = currentSettings.logDisplayColors || {};
      return {
        ...prev,
        settings: {
          ...currentSettings,
          logDisplayColors: {
            ...currentLogDisplayColors,
            enabled: checked,
          },
        },
      };
    });
  };

  const validateProfileForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.nickname || formData.nickname.trim() === "") {
      errors.nickname = "表示名は必須です。";
    } else if (formData.nickname.length > 20) {
      errors.nickname = "表示名は20文字以内で入力してください。";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateProfileForm()) {
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

      await updateUserProfile(dataToSubmit);
      toast.success("設定を更新しました！");
    } catch (error) {
      console.error("更新に失敗しました", error);
      toast.error("更新に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
      toast.success("ログアウトしました");
    } catch (error) {
      console.error("ログアウトに失敗しました", error);
      toast.error("ログアウトに失敗しました");
    }
  };

  if (authLoading || userProfileLoading || petsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">ロード中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4">このページを表示するにはログインが必要です。</p>
        <Link href="/login">
          <Button>ログインページへ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">プロフィール</TabsTrigger>
          <TabsTrigger value="account">アカウント</TabsTrigger>
          <TabsTrigger value="settings">アプリ設定</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>公開プロフィール</CardTitle>
              <CardDescription>
                他のユーザーに表示される情報を編集します。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="nickname">表示名 *</Label>
                <Input
                  id="nickname"
                  name="nickname"
                  value={formData.nickname || ""}
                  onChange={handleChange}
                  maxLength={20} // Add maxLength attribute
                />
                {validationErrors.nickname && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.nickname}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="introduction">自己紹介</Label>
                <Textarea
                  id="introduction"
                  name="introduction"
                  value={formData.introduction || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="birthday">誕生日</Label>
                  <Input
                    id="birthday"
                    name="birthday"
                    type="date"
                    value={formData.birthday || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="gender">性別</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("gender", value)
                    }
                    value={formData.gender || "other"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="性別を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">男性</SelectItem>
                      <SelectItem value="female">女性</SelectItem>
                      <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="primaryPetId">メインペット</Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("primaryPetId", value)
                  }
                  value={formData.primaryPetId || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="メインペットを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {pets.length === 0 ? (
                      <SelectItem value="no-pets" disabled>
                        ペットがいません
                      </SelectItem>
                    ) : (
                      pets.map((pet) => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          {user.isAnonymous && <AccountLinker />}
          <Card>
            <CardHeader>
              <CardTitle>アカウント情報</CardTitle>
              <CardDescription>
                ログインに使用するアカウント情報です。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={userProfile?.authEmail || ""}
                  readOnly
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="authName">認証方法</Label>
                <Input
                  id="authName"
                  type="text"
                  value={userProfile?.authProvider || ""}
                  readOnly
                  disabled
                />
              </div>
              {userProfile?.lastLoginAt && (
                <div className="grid gap-2">
                  <Label>最終ログイン日時</Label>
                  <p className="text-sm text-muted-foreground pt-2">
                    {userProfile.lastLoginAt.toDate().toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>アプリ設定</CardTitle>
              <CardDescription>
                アプリケーションの表示や動作をカスタマイnズします。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Log Color Settings */}
              <div className="space-y-4">
                <h3 className="text-md font-medium">ログの配色</h3>
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                  <Label
                    htmlFor="enableCustomColors"
                    className="block text-left"
                  >
                    <span className="block">配色をカスタマイズ</span>
                    <span className="block font-normal leading-snug text-muted-foreground">
                      ログの各要素の色を個別に設定します。
                    </span>
                  </Label>
                  <input
                    id="enableCustomColors"
                    type="checkbox"
                    checked={
                      formData.settings?.logDisplayColors?.enabled || false
                    }
                    onChange={(e) => handleToggleChange(e.target.checked)}
                    className="h-5 w-5"
                  />
                </div>
                <div
                  className={`rounded-lg border ${
                    !formData.settings?.logDisplayColors?.enabled &&
                    "opacity-50 pointer-events-none"
                  }`}
                >
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-fixed divide-y divide-gray-200">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="w-[33.333333%] px-2 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            表示
                          </th>
                          <th className="w-[33.333333%] px-2 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            背景色
                          </th>
                          <th className="w-[33.333333%] px-2 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            文字色
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {[
                          {
                            id: "creatorName" as const,
                            label: "作成者名",
                            previewText: "作成者",
                            bg: formData.settings?.logDisplayColors
                              ?.creatorNameBg,
                            text: formData.settings?.logDisplayColors
                              ?.creatorNameText,
                            defaultBg: "#e5e7eb",
                            defaultText: "#6b7280",
                          },
                          {
                            id: "time" as const,
                            label: "時刻",
                            previewText: "14:05",
                            bg: formData.settings?.logDisplayColors?.timeBg,
                            text: formData.settings?.logDisplayColors?.timeText,
                            defaultBg: "#e5e7eb",
                            defaultText: "#4b5563",
                          },
                          {
                            id: "deletedTask" as const,
                            label: "削除済ログ",
                            previewText: "削除済",
                            bg: formData.settings?.logDisplayColors
                              ?.deletedTaskBg,
                            text: formData.settings?.logDisplayColors
                              ?.deletedTaskText,
                            defaultBg: "#e5e7eb",
                            defaultText: "#9ca3af",
                          },
                        ].map((item) => (
                          <tr key={item.id}>
                            <td className="px-2 py-4 whitespace-nowrap">
                              <div className="flex items-center justify-center">
                                <span
                                  className="px-2 py-1 rounded-md text-sm"
                                  style={{
                                    backgroundColor: item.bg || item.defaultBg,
                                    color: item.text || item.defaultText,
                                  }}
                                >
                                  {item.previewText}
                                </span>
                              </div>
                            </td>
                            <td className="px-2 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="color"
                                  value={item.bg || item.defaultBg}
                                  onChange={(e) =>
                                    handleChangeColor(
                                      item.id,
                                      "Bg",
                                      e.target.value
                                    )
                                  }
                                  className="w-10 h-8 p-1 shrink-0"
                                />
                                <Input
                                  value={item.bg || item.defaultBg}
                                  onChange={(e) =>
                                    handleChangeColor(
                                      item.id,
                                      "Bg",
                                      e.target.value
                                    )
                                  }
                                  className="h-8 w-24"
                                  placeholder="#RRGGBB"
                                />
                              </div>
                            </td>
                            <td className="px-2 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="color"
                                  value={item.text || item.defaultText}
                                  onChange={(e) =>
                                    handleChangeColor(
                                      item.id,
                                      "Text",
                                      e.target.value
                                    )
                                  }
                                  className="w-10 h-8 p-1 shrink-0"
                                />
                                <Input
                                  value={item.text || item.defaultText}
                                  onChange={(e) =>
                                    handleChangeColor(
                                      item.id,
                                      "Text",
                                      e.target.value
                                    )
                                  }
                                  className="h-8 w-24"
                                  placeholder="#RRGGBB"
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Time Format Settings */}
              <div className="space-y-2">
                <h3 className="text-md font-medium">時刻フォーマット</h3>
                <Label
                  htmlFor="timeFormat"
                  className="text-sm font-normal text-muted-foreground"
                >
                  ログに表示される時刻のフォーマットを選択します。
                </Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("settings.timeFormat", value)
                  }
                  value={formData.settings?.timeFormat || "HH:mm:ss"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="フォーマットを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HH:mm:ss">
                      時間:分:秒 (例: 04:05:09)
                    </SelectItem>
                    <SelectItem value="H:mm:ss">
                      時間:分:秒 (例: 4:05:09)
                    </SelectItem>
                    <SelectItem value="HH:mm">時間:分 (例: 04:05)</SelectItem>
                    <SelectItem value="H:mm">時間:分 (例: 4:05)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Toast Position Settings */}
              <div className="space-y-2">
                <h3 className="text-md font-medium">通知の表示位置</h3>
                <Label
                  htmlFor="toastPosition"
                  className="text-sm font-normal text-muted-foreground"
                >
                  通知（トースト）が画面のどこに表示されるかを設定します。
                </Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("settings.toastPosition", value)
                  }
                  value={formData.settings?.toastPosition || "top-center"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="位置を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">左上</SelectItem>
                    <SelectItem value="top-center">上中央</SelectItem>
                    <SelectItem value="top-right">右上</SelectItem>
                    <SelectItem value="bottom-left">左下</SelectItem>
                    <SelectItem value="bottom-center">下中央</SelectItem>
                    <SelectItem value="bottom-right">右下</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <TaskLoggerSettings 
                taskLoggerSettings={formData.settings?.taskLogger}
                onSettingsChange={handleTaskLoggerSettingsChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6 space-x-4">
        {user && !user.isAnonymous && (
          <Button variant="destructive" onClick={handleLogout}>
            <LogOutIcon className="mr-2 h-4 w-4" />
            ログアウト
          </Button>
        )}
        <Button onClick={handleUpdateProfile} disabled={isSubmitting || uploading}>
          {isSubmitting || uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploading ? "アップロード中..." : "更新中..."}
            </>
          ) : (
            "保存する"
          )}
        </Button>
      </div>
    </div>
  );
}
