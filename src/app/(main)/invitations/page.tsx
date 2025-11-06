"use client";

import { useEffect, useState } from "react";
import { usePets } from "@/hooks/usePets";
import type { PendingInvitation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function InvitationsPage() {
  const { user } = useAuth();
  const { getPendingInvitations, updateInvitationStatus } = usePets();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = getPendingInvitations((invs) => {
      setInvitations(invs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, getPendingInvitations]);

  const handleInvitation = async (
    petId: string,
    memberId: string,
    status: "active" | "declined"
  ) => {
    try {
      await updateInvitationStatus(petId, memberId, status);
      toast.success(
        status === "active" ? "招待を承諾しました。" : "招待を拒否しました。"
      );
    } catch {}
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">受信した招待</h1>
      {invitations.length > 0 ? (
        <div className="space-y-4">
          {invitations.map(({ pet, memberId }) => (
            <Card key={memberId}>
              <CardHeader>
                <CardTitle>「{pet.name}」への招待</CardTitle>
              </CardHeader>
              <CardContent>
                <p>このペットの共有メンバーに招待されています。</p>
                <div className="flex space-x-2 mt-4">
                  <Button
                    onClick={() => handleInvitation(pet.id, memberId, "active")}
                  >
                    承諾
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleInvitation(pet.id, memberId, "declined")
                    }
                  >
                    拒否
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>保留中の招待はありません。</p>
      )}
    </div>
  );
}
