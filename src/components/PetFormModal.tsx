// src/components/PetFormModal.tsx
// ペットの新規追加や既存情報の編集を行うモーダル。
// 依存: usePets (ペット情報の追加・更新フック)

"use client";

import React, { useState, useEffect } from "react";
import { usePets, Pet } from "@/hooks/usePets";

interface PetFormModalProps {
  isOpen: boolean; // モーダルの表示状態
  onClose: () => void; // モーダルを閉じる処理
  petToEdit?: Pet | null; // 編集対象のペット情報（新規の場合はnull）
}

export const PetFormModal: React.FC<PetFormModalProps> = ({
  isOpen,
  onClose,
  petToEdit,
}) => {
  const { addPet, updatePet } = usePets(); // ペット追加・更新用の関数を取得
  const [name, setName] = useState(""); // ペット名
  const [breed, setBreed] = useState(""); // 犬種（任意）
  const [birthday, setBirthday] = useState(""); // 誕生日（任意）
  const [isSubmitting, setIsSubmitting] = useState(false); // 保存処理中フラグ

  // モーダルが開かれたときにフォームを初期化
  useEffect(() => {
    if (isOpen) {
      if (petToEdit) {
        setName(petToEdit.name);
        setBreed(petToEdit.breed);
        setBirthday(petToEdit.birthday);
      } else {
        setName("");
        setBreed("");
        setBirthday("");
      }
    }
  }, [isOpen, petToEdit]);

  // フォーム送信処理
  const handleSubmit = async () => {
    if (!name) {
      alert("ペットの名前を入力してください。"); // 必須項目のバリデーション
      return;
    }

    setIsSubmitting(true);
    try {
      const petData = { name, breed, birthday };
      if (petToEdit) {
        // 既存ペットの更新処理
        await updatePet(petToEdit.id, petData);
        alert("ペット情報を更新しました！");
      } else {
        // 新規ペットの追加処理
        await addPet(petData);
        alert("ペットを追加しました！");
      }
      onClose();
    } catch (error) {
      console.error("ペット情報の保存に失敗しました:", error);
      alert("ペット情報の保存に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // モーダル非表示時は描画しない
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-4">
          {petToEdit ? "ペット情報を編集" : "新しいペットを追加"}
        </h2>

        {/* ペット名入力（必須） */}
        <div className="mb-4">
          <label
            htmlFor="petName"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            名前
          </label>
          <input
            type="text"
            id="petName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="ポチ"
          />
        </div>

        {/* 犬種入力（任意） */}
        <div className="mb-4">
          <label
            htmlFor="petBreed"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            犬種 (任意)
          </label>
          <input
            type="text"
            id="petBreed"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="柴犬"
          />
        </div>

        {/* 誕生日入力（任意） */}
        <div className="mb-6">
          <label
            htmlFor="petBirthday"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            誕生日 (任意)
          </label>
          <input
            type="date"
            id="petBirthday"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        {/* ボタン群（キャンセル・保存） */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isSubmitting}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isSubmitting}
          >
            {isSubmitting ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
};
