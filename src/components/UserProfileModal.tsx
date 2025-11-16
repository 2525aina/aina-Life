"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface UserProfileModalProps {
  uid: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ uid, isOpen, onClose }: UserProfileModalProps) {
  const { userProfile, loading } = useUserProfile(uid);

  if (!uid || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex flex-col items-center text-center">
          <DialogTitle className="text-2xl font-bold">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            ) : userProfile ? (
              userProfile.nickname || userProfile.authName || "名無しユーザー"
            ) : (
              "ユーザーが見つかりません"
            )}
          </DialogTitle>
          {!loading && userProfile && (
            <>
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={userProfile.profileImageUrl} alt={userProfile.nickname || userProfile.authName || "ユーザー"} />
                <AvatarFallback className="text-3xl">
                  {(userProfile.nickname || userProfile.authName || "U").charAt(0)}
                </AvatarFallback>
              </Avatar>
              <DialogDescription className="text-sm text-gray-500">
                {userProfile.authEmail}
              </DialogDescription>
            </>
          )}
        </DialogHeader>
        {!loading && userProfile && (
          <div className="space-y-4 py-4">
            {userProfile.introduction && (
              <>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {userProfile.introduction}
                </p>
                <Separator />
              </>
            )}
            {userProfile.birthday && (
              <div className="flex justify-between text-sm">
                <span className="font-medium">誕生日:</span>
                <span>{userProfile.birthday}</span>
              </div>
            )}
            {userProfile.gender && (
              <div className="flex justify-between text-sm">
                <span className="font-medium">性別:</span>
                <span>
                  {userProfile.gender === "male"
                    ? "男性"
                    : userProfile.gender === "female"
                    ? "女性"
                    : "その他"}
                </span>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
