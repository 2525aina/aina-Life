"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { doc, updateDoc, getFirestore, Timestamp } from "firebase/firestore";
import { app } from "@/lib/firebase"; // Assuming firebase app is initialized here
import { User } from "firebase/auth"; // Firebase User type
import { Pet } from "@/hooks/usePets"; // Assuming Pet type from usePets

// 誕生日文字列から年齢を計算するヘルパー関数
const calculateAge = (birthdayString: string): number | null => {
  if (!birthdayString) return null;
  const birthDate = new Date(birthdayString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// 誕生日文字列を YYYY/MM/DD 形式にフォーマットするヘルパー関数
const formatBirthday = (birthdayString: string): string => {
  if (!birthdayString) return "未設定";
  const date = new Date(birthdayString);
  if (isNaN(date.getTime())) return "未設定"; // 無効な日付の場合
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

// 性別を日本語に変換するヘルパー関数
const formatGender = (genderString?: string): string => {
  switch (genderString) {
    case "male":
      return "男性";
    case "female":
      return "女性";
    case "other":
      return "その他";
    default:
      return "未設定";
  }
};

interface FirestoreUser {
  nickname?: string;
  birthday?: string;
  gender?: string;
  introduction?: string;
  primaryPetId?: string;
  settings?: {
    theme?: "light" | "dark" | "system";
    notifications?: {
      dailySummary?: boolean;
    };
  };
  updatedAt?: Timestamp; // Add updatedAt to FirestoreUser
}

interface UserProfileUpdateData {
  nickname: string;
  birthday: string;
  gender: string;
  introduction: string;
  primaryPetId: string;
  settings: {
    theme: "light" | "dark" | "system";
    notifications: {
      dailySummary: boolean;
    };
  };
  updatedAt: Timestamp; // Change to Timestamp
}

interface UserProfileEditFormProps {
  currentUser: User; // Firebase Auth User object
  firestoreUser: FirestoreUser; // Firestore user document data (nickname, birthday, etc.)
  pets: Pet[]; // List of pets for primaryPetId selection
  onSave: (updatedData: UserProfileUpdateData) => Promise<void>;
}

export const UserProfileEditForm: React.FC<UserProfileEditFormProps> = ({
  currentUser,
  firestoreUser,
  pets,
  onSave,
}) => {
  const [nickname, setNickname] = useState(firestoreUser?.nickname || "");
  const [birthday, setBirthday] = useState(firestoreUser?.birthday || "");
  const [gender, setGender] = useState(firestoreUser?.gender || "");
  const [introduction, setIntroduction] = useState(
    firestoreUser?.introduction || ""
  );
  const [primaryPetId, setPrimaryPetId] = useState(
    firestoreUser?.primaryPetId || ""
  );
  const [theme, setTheme] = useState(
    firestoreUser?.settings?.theme || "system"
  );
  const [dailySummaryNotifications, setDailySummaryNotifications] = useState(
    firestoreUser?.settings?.notifications?.dailySummary || false
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // New state for collapse

  useEffect(() => {
    setNickname(firestoreUser?.nickname || "");
    setBirthday(firestoreUser?.birthday || "");
    setGender(firestoreUser?.gender || "");
    setIntroduction(firestoreUser?.introduction || "");
    setPrimaryPetId(firestoreUser?.primaryPetId || "");
    setTheme(firestoreUser?.settings?.theme || "system");
    setDailySummaryNotifications(
      firestoreUser?.settings?.notifications?.dailySummary || false
    );
  }, [firestoreUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedData = {
      nickname,
      birthday,
      gender,
      introduction,
      primaryPetId,
      settings: {
        theme,
        notifications: {
          dailySummary: dailySummaryNotifications,
        },
      },
      updatedAt: Timestamp.fromDate(new Date()), // Firestore Timestamp
    };

    try {
      await onSave(updatedData);
      toast.success("プロフィールを更新しました！");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("プロフィールの更新に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const userAge = firestoreUser.birthday
    ? calculateAge(firestoreUser.birthday)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Display Auth Name and Email (non-editable) */}
      <div className="bg-gray-600 p-3 rounded-md">
        <p className="text-lg font-semibold">
          名前: {currentUser.displayName || "未設定"}
        </p>
        <p className="text-sm text-gray-300">
          メール: {currentUser.email || "未設定"}
        </p>
        {firestoreUser.nickname && (
          <p className="text-sm text-gray-300">
            ニックネーム: {firestoreUser.nickname}
          </p>
        )}
        {firestoreUser.birthday && (
          <p className="text-sm text-gray-300">
            誕生日: {formatBirthday(firestoreUser.birthday)}
          </p>
        )}
        {userAge !== null && (
          <p className="text-sm text-gray-300">年齢: {userAge}歳</p>
        )}
        {firestoreUser.gender && (
          <p className="text-sm text-gray-300">
            性別: {formatGender(firestoreUser.gender)}
          </p>
        )}
      </div>

      {/* Collapsible section for editable fields */}
      <div
        className="flex items-center justify-between cursor-pointer py-2"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-lg font-semibold text-white">詳細情報</h3>
        <svg
          className={`w-5 h-5 text-white transform transition-transform duration-200 ${
            isCollapsed ? "rotate-0" : "rotate-180"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </div>

      {!isCollapsed && (
        <div className="space-y-4">
          {/* Nickname */}
          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-gray-300"
            >
              ニックネーム
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Birthday */}
          <div>
            <label
              htmlFor="birthday"
              className="block text-sm font-medium text-gray-300"
            >
              誕生日
            </label>
            <input
              type="date"
              id="birthday"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Gender */}
          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-gray-300"
            >
              性別
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              <option value="male">男性</option>
              <option value="female">女性</option>
              <option value="other">その他</option>
            </select>
          </div>

          {/* Introduction */}
          <div>
            <label
              htmlFor="introduction"
              className="block text-sm font-medium text-gray-300"
            >
              自己紹介
            </label>
            <textarea
              id="introduction"
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              rows={3}
              className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          {/* Primary Pet ID */}
          <div>
            <label
              htmlFor="primaryPetId"
              className="block text-sm font-medium text-gray-300"
            >
              デフォルト表示ペット
            </label>
            <select
              id="primaryPetId"
              value={primaryPetId}
              onChange={(e) => setPrimaryPetId(e.target.value)}
              className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Setting */}
          <div className="flex items-center justify-between">
            <label
              htmlFor="theme"
              className="block text-sm font-medium text-gray-300"
            >
              テーマ
            </label>
            <select
              id="theme"
              value={theme}
              onChange={(e) =>
                setTheme(e.target.value as "light" | "dark" | "system")
              }
              className="mt-1 block bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">ライト</option>
              <option value="dark">ダーク</option>
              <option value="system">システム</option>
            </select>
          </div>

          {/* Daily Summary Notifications */}
          <div className="flex items-center justify-between">
            <label
              htmlFor="dailySummaryNotifications"
              className="block text-sm font-medium text-gray-300"
            >
              日次サマリー通知
            </label>
            <input
              type="checkbox"
              id="dailySummaryNotifications"
              checked={dailySummaryNotifications}
              onChange={(e) => setDailySummaryNotifications(e.target.checked)}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>

          {/* Profile Image Upload (Placeholder) */}
          {/* TODO: Implement actual image upload logic */}
          <div>
            <label
              htmlFor="profileImage"
              className="block text-sm font-medium text-gray-300"
            >
              プロフィール画像
            </label>
            <input
              type="file"
              id="profileImage"
              accept="image/*"
              // onChange={handleImageUpload} // Implement this
              className="mt-1 block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {/* {profileImageUrl && <img src={profileImageUrl} alt="Profile Preview" className="mt-2 w-24 h-24 rounded-full object-cover" />} */}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500"
            disabled={isSaving}
          >
            {isSaving ? "保存中..." : "プロフィールを保存"}
          </button>
        </div>
      )}
    </form>
  );
};
