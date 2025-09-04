// src/components/PetSharingManagement.tsx
// ペットの共有メンバー管理と新規招待を行うコンポーネント
"use client";

import { useState, useEffect } from 'react';
import toast from "react-hot-toast";
import { usePetSelection } from '@/contexts/PetSelectionContext';
import { usePets, Member } from '@/hooks/usePets';

export const PetSharingManagement = () => {
  const { selectedPet } = usePetSelection();
  const { getSharedMembers, inviteMember, removeMember } = usePets();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (selectedPet) {
      setIsLoading(true);
      const unsubscribe = getSharedMembers(selectedPet.id, (updatedMembers) => {
        setMembers(updatedMembers);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setMembers([]);
    }
  }, [selectedPet, getSharedMembers]);

  const handleInvite = async () => {
    if (!selectedPet) {
      toast.error("招待するペットを選択してください。");
      return;
    }
    if (!inviteEmail) {
      toast.error("招待するユーザーのメールアドレスを入力してください。");
      return;
    }

    setIsInviting(true);
    try {
      await inviteMember(selectedPet.id, inviteEmail);
      toast.success(`${inviteEmail}さんを招待しました。`);
      setInviteEmail('');
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = (memberId: string) => {
    if (!selectedPet) return;
    if (window.confirm('本当にこのメンバーの共有を解除しますか？')) {
      toast.promise(
        removeMember(selectedPet.id, memberId),
        {
          loading: "解除中...",
          success: "メンバーを解除しました！",
          error: "解除に失敗しました。",
        }
      );
    }
  };

  if (!selectedPet) {
    return (
      <div className="bg-gray-700 p-4 rounded-lg mt-6">
        <p className="text-center text-gray-400">上部のヘッダーからペットを選択すると、共有管理ができます。</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 p-6 rounded-lg mt-6 text-white">
      <h2 className="text-xl font-bold mb-4">「{selectedPet.name}」の共有管理</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">新しいメンバーを招待</h3>
        <div className="flex space-x-2">
          <input 
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="招待するユーザーのメールアドレス"
            className="flex-grow bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isInviting}
          />
          <button 
            onClick={handleInvite} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500"
            disabled={isInviting}
          >
            {isInviting ? "招待中..." : "招待"}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">共有中のメンバー</h3>
        {isLoading ? (
          <p>メンバーを読み込み中...</p>
        ) : members.length > 0 ? (
          <ul className="space-y-2">
            {members.map(member => (
              <li key={member.id} className="flex items-center justify-between bg-gray-600 p-2 rounded-md">
                <div>
                  <p className="font-medium">{member.inviteEmail || member.id}</p>
                  <p className="text-sm text-gray-400">役割: {member.role} ({member.status})</p>
                </div>
                {member.role !== 'owner' && (
                  <button onClick={() => handleRemove(member.id)} className="text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded-md">
                    解除
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">このペットはまだ誰とも共有されていません。</p>
        )}
      </div>
    </div>
  );
};
