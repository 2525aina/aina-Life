'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/features/AppLayout';
import { useMembers } from '@/hooks/useMembers';
import { usePets } from '@/hooks/usePets';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, UserPlus, Crown, User, Trash2, LogOut, Mail, Clock, Shield, Eye, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { MEMBER_ROLES, type MemberRole } from '@/lib/types';

function PetSettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const petId = searchParams.get('id');

    const { user } = useAuth();
    const { pets, updatePet, deletePet } = usePets();
    const { members, loading, isOwner, canManageMembers, inviteMember, updateMemberRole, transferOwnership, removeMember, leaveTeam } = useMembers(petId);

    const pet = pets.find((p) => p.id === petId);

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<MemberRole>('editor');
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [petName, setPetName] = useState('');
    const [petBreed, setPetBreed] = useState('');

    useEffect(() => {
        if (pet) {
            setPetName(pet.name);
            setPetBreed(pet.breed || '');
        }
    }, [pet]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;
        setIsSubmitting(true);
        try {
            await inviteMember(inviteEmail.trim(), inviteRole);
            toast.success('招待を送信しました');
            setInviteEmail('');
            setInviteRole('editor');
            setIsInviteDialogOpen(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'エラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
        try {
            await updateMemberRole(memberId, newRole);
            toast.success('権限を変更しました');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'エラーが発生しました');
        }
    };

    const handleTransferOwnership = async (memberId: string, memberEmail: string) => {
        try {
            await transferOwnership(memberId);
            toast.success(`${memberEmail}にオーナー権限を譲渡しました`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'エラーが発生しました');
        }
    };

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        try {
            await removeMember(memberId);
            toast.success(`${memberName}さんを削除しました`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'エラーが発生しました');
        }
    };

    const handleLeaveTeam = async () => {
        try {
            await leaveTeam();
            toast.success('チームから脱退しました');
            router.push('/dashboard');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'エラーが発生しました');
        }
    };

    const handleDeletePet = async () => {
        if (!petId) return;
        try {
            await deletePet(petId);
            toast.success('ペットを削除しました');
            router.push('/dashboard');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'エラーが発生しました');
        }
    };

    const handleUpdatePet = async () => {
        if (!petId || !petName.trim()) {
            toast.error('名前を入力してください');
            return;
        }
        try {
            await updatePet(petId, { name: petName.trim(), breed: petBreed.trim() || undefined });
            toast.success('更新しました');
        } catch (error) {
            toast.error('エラーが発生しました');
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner': return <Crown className="w-4 h-4 text-amber-500" />;
            case 'editor': return <Edit className="w-4 h-4 text-blue-500" />;
            case 'viewer': return <Eye className="w-4 h-4 text-gray-500" />;
            default: return <User className="w-4 h-4" />;
        }
    };

    const getRoleLabel = (role: string) => {
        return MEMBER_ROLES.find((r) => r.value === role)?.label || role;
    };

    if (!petId || !pet) {
        return (
            <AppLayout>
                <div className="p-4 text-center py-12">
                    <p className="text-muted-foreground">ペットが見つかりません</p>
                    <Button onClick={() => router.push('/dashboard')} className="mt-4">ダッシュボードに戻る</Button>
                </div>
            </AppLayout>
        );
    }

    const activeMembers = members.filter((m) => m.status === 'active');
    const pendingMembers = members.filter((m) => m.status === 'pending');

    return (
        <AppLayout>
            <div className="p-4 space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-6">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-5 h-5" /></Button>
                        <h1 className="text-xl font-bold">{pet.name}の設定</h1>
                    </div>

                    {/* ペット情報 */}
                    <Card className="mb-6">
                        <CardHeader className="pb-2"><CardTitle className="text-base">ペット情報</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div><Label htmlFor="name">名前</Label><Input id="name" value={petName} onChange={(e) => setPetName(e.target.value)} className="mt-1" disabled={!isOwner} /></div>
                            <div><Label htmlFor="breed">品種</Label><Input id="breed" value={petBreed} onChange={(e) => setPetBreed(e.target.value)} placeholder="例：柴犬" className="mt-1" disabled={!isOwner} /></div>
                            {isOwner && <Button onClick={handleUpdatePet} className="w-full">保存</Button>}
                        </CardContent>
                    </Card>

                    {/* メンバー管理 */}
                    <Card className="mb-6">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div><CardTitle className="text-base">メンバー</CardTitle><CardDescription className="text-sm">ペット情報を共有するメンバー</CardDescription></div>
                                {canManageMembers && (
                                    <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                                        <DialogTrigger asChild><Button size="sm" className="gap-1 gradient-primary"><UserPlus className="w-4 h-4" />招待</Button></DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader><DialogTitle>メンバーを招待</DialogTitle><DialogDescription>招待したい人のメールアドレスと権限を選択してください。</DialogDescription></DialogHeader>
                                            <form onSubmit={handleInvite} className="space-y-4 pt-4">
                                                <div><Label htmlFor="email">メールアドレス</Label><Input id="email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="example@gmail.com" className="mt-1" /></div>
                                                <div>
                                                    <Label>権限</Label>
                                                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as MemberRole)}>
                                                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {MEMBER_ROLES.filter((r) => r.value !== 'owner').map((role) => (
                                                                <SelectItem key={role.value} value={role.value}>
                                                                    <div className="flex items-center gap-2">
                                                                        {getRoleIcon(role.value)}
                                                                        <span>{role.label}</span>
                                                                        <span className="text-xs text-muted-foreground ml-2">{role.description}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Button type="submit" disabled={isSubmitting || !inviteEmail.trim()} className="w-full gradient-primary">{isSubmitting ? '送信中...' : '招待を送信'}</Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}</div>
                            ) : (
                                <div className="space-y-2">
                                    {/* アクティブメンバー */}
                                    {activeMembers.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10"><AvatarFallback className="bg-primary/10">{getRoleIcon(member.role)}</AvatarFallback></Avatar>
                                                <div>
                                                    <p className="font-medium flex items-center gap-2">
                                                        {member.userId === user?.uid ? 'あなた' : member.inviteEmail || 'メンバー'}
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${member.role === 'owner' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : member.role === 'editor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                                                            {getRoleLabel(member.role)}
                                                        </span>
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">{member.inviteEmail}</p>
                                                </div>
                                            </div>
                                            {canManageMembers && member.userId !== user?.uid && (
                                                <div className="flex gap-1">
                                                    {/* 権限変更 */}
                                                    <Select value={member.role} onValueChange={(v) => handleRoleChange(member.id, v as MemberRole)}>
                                                        <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {MEMBER_ROLES.map((role) => (
                                                                <SelectItem key={role.value} value={role.value}>
                                                                    <div className="flex items-center gap-2">{getRoleIcon(role.value)}<span>{role.label}</span></div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {/* 削除ボタン */}
                                                    {member.role !== 'owner' && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader><AlertDialogTitle>メンバーを削除</AlertDialogTitle><AlertDialogDescription>このメンバーを削除しますか？</AlertDialogDescription></AlertDialogHeader>
                                                                <AlertDialogFooter><AlertDialogCancel>キャンセル</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveMember(member.id, member.inviteEmail || 'メンバー')} className="bg-destructive text-destructive-foreground">削除</AlertDialogAction></AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* 保留中の招待 */}
                                    {pendingMembers.length > 0 && (
                                        <>
                                            <p className="text-sm text-muted-foreground pt-2">招待中</p>
                                            {pendingMembers.map((member) => (
                                                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-dashed">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Mail className="w-5 h-5 text-muted-foreground" /></div>
                                                        <div>
                                                            <p className="font-medium text-muted-foreground flex items-center gap-2">
                                                                {member.inviteEmail}
                                                                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{getRoleLabel(member.role)}</span>
                                                            </p>
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />承認待ち</p>
                                                        </div>
                                                    </div>
                                                    {canManageMembers && <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.id, member.inviteEmail || '')} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>}
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 危険ゾーン */}
                    <Card className="border-destructive/50">
                        <CardHeader className="pb-2"><CardTitle className="text-base text-destructive">危険な操作</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {!isOwner && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="outline" className="w-full text-destructive hover:text-destructive"><LogOut className="w-4 h-4 mr-2" />チームから脱退</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>チームから脱退</AlertDialogTitle><AlertDialogDescription>本当にこのペットのチームから脱退しますか？</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>キャンセル</AlertDialogCancel><AlertDialogAction onClick={handleLeaveTeam} className="bg-destructive text-destructive-foreground">脱退する</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            {isOwner && activeMembers.length > 1 && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="outline" className="w-full text-destructive hover:text-destructive"><LogOut className="w-4 h-4 mr-2" />チームから脱退</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>チームから脱退</AlertDialogTitle><AlertDialogDescription>オーナーとして脱退する前に、他のメンバーをオーナーに設定してください。</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>閉じる</AlertDialogCancel></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            {isOwner && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="outline" className="w-full text-destructive hover:text-destructive"><Trash2 className="w-4 h-4 mr-2" />ペットを削除</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>ペットを削除</AlertDialogTitle><AlertDialogDescription>本当に {pet.name} を削除しますか？すべてのデータが削除されます。</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>キャンセル</AlertDialogCancel><AlertDialogAction onClick={handleDeletePet} className="bg-destructive text-destructive-foreground">削除する</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </AppLayout>
    );
}

export default function PetSettingsPage() {
    return (
        <Suspense fallback={<AppLayout><div className="p-4 text-center py-12">読み込み中...</div></AppLayout>}>
            <PetSettingsContent />
        </Suspense>
    );
}
