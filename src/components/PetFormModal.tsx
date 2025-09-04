// src/components/PetFormModal.tsx
// ペットの新規追加や既存情報の編集を行うモーダル。
// 依存: usePets (ペット情報の追加・更新フック)

"use client";

import React, { useState, useEffect } from "react";
import { usePets, Pet, VetInfo } from "@/hooks/usePets";

interface PetFormModalProps {
  isOpen: boolean; // モーダルの表示状態
  onClose: () => void; // モーダルを閉じる処理
  petToEdit?: Pet | null; // 編集対象のペット情報（新規の場合はnull）
}

const createEmptyVet = (): VetInfo => ({ id: Date.now().toString(), name: '', phone: '' });

export const PetFormModal: React.FC<PetFormModalProps> = ({
  isOpen,
  onClose,
  petToEdit,
}) => {
  const { addPet, updatePet } = usePets();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Omit<Pet, 'id' | 'ownerIds'>>({
    name: '',
    breed: '',
    birthday: '',
    gender: 'other',
    adoptionDate: '',
    profileImageUrl: '',
    microchipId: '',
    medicalNotes: '',
    vetInfo: [],
  });

  useEffect(() => {
    if (isOpen) {
      if (petToEdit) {
        setFormData({
          name: petToEdit.name || '',
          breed: petToEdit.breed || '',
          birthday: petToEdit.birthday || '',
          gender: petToEdit.gender || 'other',
          adoptionDate: petToEdit.adoptionDate || '',
          profileImageUrl: petToEdit.profileImageUrl || '',
          microchipId: petToEdit.microchipId || '',
          medicalNotes: petToEdit.medicalNotes || '',
          vetInfo: Array.isArray(petToEdit.vetInfo) ? petToEdit.vetInfo : [],
        });
      } else {
        setFormData({
          name: '',
          breed: '',
          birthday: '',
          gender: 'other',
          adoptionDate: '',
          profileImageUrl: '',
          microchipId: '',
          medicalNotes: '',
          vetInfo: [],
        });
      }
    }
  }, [isOpen, petToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVetChange = (index: number, field: 'name' | 'phone', value: string) => {
    const updatedVets = formData.vetInfo ? [...formData.vetInfo] : [];
    updatedVets[index][field] = value;
    setFormData(prev => ({ ...prev, vetInfo: updatedVets }));
  };

  const addVet = () => {
    if (formData.vetInfo && formData.vetInfo.length < 5) {
      const updatedVets = [...formData.vetInfo, createEmptyVet()];
      setFormData(prev => ({ ...prev, vetInfo: updatedVets }));
    }
  };

  const removeVet = (index: number) => {
    const updatedVets = formData.vetInfo ? formData.vetInfo.filter((_, i) => i !== index) : [];
    setFormData(prev => ({ ...prev, vetInfo: updatedVets }));
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      alert("ペットの名前を入力してください。");
      return;
    }
    setIsSubmitting(true);
    try {
      if (petToEdit) {
        await updatePet(petToEdit.id, formData);
        alert("ペット情報を更新しました！");
      } else {
        await addPet(formData);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white p-6 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{petToEdit ? "ペット情報を編集" : "新しいペットを追加"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="block text-sm font-bold mb-2">名前 *</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" /></div>
          <div><label className="block text-sm font-bold mb-2">犬種</label><input type="text" name="breed" value={formData.breed} onChange={handleChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" /></div>
          <div><label className="block text-sm font-bold mb-2">性別</label><select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600"><option value="male">男の子</option><option value="female">女の子</option><option value="other">その他</option></select></div>
          <div><label className="block text-sm font-bold mb-2">誕生日</label><input type="date" name="birthday" value={formData.birthday} onChange={handleChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" /></div>
          <div><label className="block text-sm font-bold mb-2">お迎え日</label><input type="date" name="adoptionDate" value={formData.adoptionDate} onChange={handleChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" /></div>
          <div className="md:col-span-2"><label className="block text-sm font-bold mb-2">マイクロチップID</label><input type="text" name="microchipId" value={formData.microchipId} onChange={handleChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" /></div>
          <div className="md:col-span-2"><label className="block text-sm font-bold mb-2">健康に関するメモ</label><textarea name="medicalNotes" value={formData.medicalNotes} onChange={handleChange} rows={3} className="w-full p-2 rounded bg-gray-700 border border-gray-600"></textarea></div>
          
          <div className="md:col-span-2 border-t border-gray-600 pt-4 mt-2">
            <h3 className="text-lg font-semibold mb-2">かかりつけ動物病院</h3>
            <div className="space-y-4">
              {formData.vetInfo?.map((vet, index) => (
                <div key={vet.id} className="p-2 border border-gray-700 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    <div><label className="text-sm">病院名</label><input type="text" value={vet.name} onChange={(e) => handleVetChange(index, 'name', e.target.value)} className="w-full p-2 mt-1 rounded bg-gray-900 border border-gray-600" /></div>
                    <div><label className="text-sm">電話番号</label><input type="tel" value={vet.phone} onChange={(e) => handleVetChange(index, 'phone', e.target.value)} className="w-full p-2 mt-1 rounded bg-gray-900 border border-gray-600" /></div>
                  </div>
                  <button onClick={() => removeVet(index)} className="text-red-400 hover:text-red-300 text-sm mt-2">削除</button>
                </div>
              ))}
            </div>
            {(!formData.vetInfo || formData.vetInfo.length < 5) && (
              <button onClick={addVet} className="mt-2 text-sky-400 hover:text-sky-300">+ 病院を追加</button>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 font-bold py-2 px-4 rounded" disabled={isSubmitting}>キャンセル</button>
          <button onClick={handleSubmit} className="bg-sky-500 hover:bg-sky-600 font-bold py-2 px-4 rounded" disabled={isSubmitting}>{isSubmitting ? "保存中..." : "保存"}</button>
        </div>
      </div>
    </div>
  );
};
