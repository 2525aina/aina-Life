// src/components/ProfileCard.tsx
// 選択されたペットの詳細情報を表示するカードコンポーネント
"use client";

import { Pet } from "@/hooks/usePets";
import { WeightManagement } from "./WeightManagement";
import { calculatePeriod } from "@/lib/dateUtils"; // 日付計算ユーティリティをインポート

interface ProfileCardProps {
  pet: Pet;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  pet,
  onEdit,
  onDelete,
}) => {
  const age = calculatePeriod(pet.birthday);
  const timeWithFamily = calculatePeriod(pet.adoptionDate);

  const genderMap = {
    male: "男の子",
    female: "女の子",
    other: "その他",
  };

  return (
    <div className="bg-gray-700 shadow-lg rounded-lg p-6 mt-6 text-white">
      <div className="flex flex-col md:flex-row">
        {/* Left side: Image and Name */}
        <div className="md:w-1/3 text-center mb-6 md:mb-0">
          <div className="w-32 h-32 mx-auto rounded-full bg-gray-800 mb-4 flex items-center justify-center">
            {pet.profileImageUrl ? (
              <img
                src={pet.profileImageUrl}
                alt={pet.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-gray-500">No Image</span>
            )}
          </div>
          <h2 className="text-2xl font-bold">{pet.name}</h2>
        </div>

        {/* Right side: Details */}
        <div className="md:w-2/3 md:pl-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-6">
            <div>
              <p className="text-sm text-gray-400">犬種</p>
              <p>{pet.breed || "未設定"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">性別</p>
              <p>{(pet.gender && genderMap[pet.gender]) || "未設定"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">誕生日</p>
              <p>{pet.birthday ? `${pet.birthday} (${age})` : "未設定"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">お迎え日</p>
              <p>
                {pet.adoptionDate
                  ? `${pet.adoptionDate} (${timeWithFamily})`
                  : "未設定"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">マイクロチップID</p>
              <p>{pet.microchipId || "未設定"}</p>
            </div>
          </div>

          {/* Vet and Medical Notes */}
          <div className="space-y-4">
            <div>
              <h4 className="text-md font-semibold text-gray-300 border-b border-gray-600 pb-1 mb-2">
                かかりつけ動物病院
              </h4>
              {pet.vetInfo && pet.vetInfo.length > 0 ? (
                <div className="space-y-2">
                  {pet.vetInfo.map((vet) => (
                    <div key={vet.id} className="text-sm">
                      <p>
                        <strong>病院名:</strong> {vet.name || "未設定"}
                      </p>
                      <p>
                        <strong>電話番号:</strong> {vet.phone || "未設定"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm">未設定</p>
              )}
            </div>
            <div>
              <h4 className="text-md font-semibold text-gray-300 border-b border-gray-600 pb-1 mb-2">
                健康に関するメモ
              </h4>
              <p className="text-sm whitespace-pre-wrap">
                {pet.medicalNotes || "メモはありません"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 mt-6">
            <button
              onClick={onEdit}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md"
            >
              編集
            </button>
            <button
              onClick={onDelete}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md"
            >
              削除
            </button>
            <button
              disabled
              className="bg-gray-500 text-gray-300 font-bold py-2 px-4 rounded-md cursor-not-allowed"
            >
              共有
            </button>
          </div>
        </div>
      </div>

      {/* Weight Management Component */}
      <WeightManagement pet={pet} />
    </div>
  );
};
