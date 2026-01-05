'use client';

import { usePendingInvitations } from '@/hooks/usePendingInvitations';
import { useMembers } from '@/hooks/useMembers';
import type { Pet } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PawPrint, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useState } from 'react';

export function PendingInvitations() {
    const { invitations, loading } = usePendingInvitations();
    const [processingId, setProcessingId] = useState<string | null>(null);

    if (loading || invitations.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
        >
            <Card className="border-primary/50 bg-primary/5">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <PawPrint className="w-4 h-4 text-primary" />
                        ペットへの招待
                    </CardTitle>
                    <CardDescription>あなたを招待しているペットがあります</CardDescription>
                </CardHeader>
                <CardContent>
                    <AnimatePresence>
                        {invitations.map((invitation) => (
                            <InvitationItem
                                key={invitation.member.id}
                                invitation={invitation}
                                processingId={processingId}
                                setProcessingId={setProcessingId}
                            />
                        ))}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function InvitationItem({
    invitation,
    processingId,
    setProcessingId
}: {
    invitation: { pet: Pet; member: { id: string } };
    processingId: string | null;
    setProcessingId: (id: string | null) => void;
}) {
    const { acceptInvitation, declineInvitation } = useMembers(invitation.pet.id);
    const isProcessing = processingId === invitation.member.id;

    const handleAccept = async () => {
        setProcessingId(invitation.member.id);
        try {
            await acceptInvitation(invitation.member.id);
            toast.success(`${invitation.pet.name}のチームに参加しました！`);
        } catch (error) {
            toast.error('エラーが発生しました');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDecline = async () => {
        setProcessingId(invitation.member.id);
        try {
            await declineInvitation(invitation.member.id);
            toast.success('招待を辞退しました');
        } catch (error) {
            toast.error('エラーが発生しました');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between p-3 rounded-lg bg-card"
        >
            <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                    <AvatarImage src={invitation.pet.avatarUrl} alt={invitation.pet.name} />
                    <AvatarFallback className="bg-primary/10 flex items-center justify-center overflow-hidden">
                        <img src="/ogp.webp" alt="Pet" className="w-full h-full object-cover opacity-50 grayscale" />
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-medium">{invitation.pet.name}</p>
                    <p className="text-sm text-muted-foreground">への招待</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDecline}
                    disabled={isProcessing}
                >
                    <X className="w-4 h-4" />
                </Button>
                <Button
                    size="sm"
                    className="gradient-primary"
                    onClick={handleAccept}
                    disabled={isProcessing}
                >
                    <Check className="w-4 h-4" />
                </Button>
            </div>
        </motion.div>
    );
}
