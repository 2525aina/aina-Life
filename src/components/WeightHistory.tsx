"use client";

import { useState } from "react";
import { useWeights } from "@/hooks/useWeights";
import type { Weight } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { WeightForm } from '@/components/WeightForm';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { toast } from 'sonner';

interface WeightHistoryProps {
  dogId: string;
}

export function WeightHistory({ dogId }: WeightHistoryProps) {
  const { weights, loading, error, deleteWeight } = useWeights(dogId);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [weightToEdit, setWeightToEdit] = useState<Weight | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [weightToDeleteId, setWeightToDeleteId] = useState<string | null>(null);

  const handleEdit = (weight: Weight) => {
    setWeightToEdit(weight);
    setIsEditFormOpen(true);
  };

  const handleDelete = (weightId: string) => {
    setWeightToDeleteId(weightId);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (weightToDeleteId) {
      await deleteWeight(weightToDeleteId);
      toast.success("体重記録を削除しました。");
      setWeightToDeleteId(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="ml-2">体重履歴をロード中...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">エラー: {error}</p>;
  }

  if (weights.length === 0) {
    return <p>体重記録がありません。</p>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日付</TableHead>
            <TableHead>体重</TableHead>
            <TableHead>単位</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {weights.map((weight) => (
            <TableRow key={weight.id}>
              <TableCell>{format(weight.date.toDate(), 'yyyy/MM/dd HH:mm')}</TableCell>
              <TableCell>{weight.value}</TableCell>
              <TableCell>{weight.unit}</TableCell>
              <TableCell className="text-right">
                <Dialog open={isEditFormOpen && weightToEdit?.id === weight.id} onOpenChange={setIsEditFormOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(weight)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>体重記録の編集</DialogTitle>
                    </DialogHeader>
                    <WeightForm dogId={dogId} initialWeight={weightToEdit || undefined} onSuccess={() => setIsEditFormOpen(false)} />
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(weight.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="体重記録の削除確認"
        message="本当にこの体重記録を削除しますか？この操作は元に戻せません。"
        onConfirm={handleConfirmDelete}
        confirmButtonText="削除する"
        cancelButtonText="キャンセル"
        isDestructive={true}
      />
    </div>
  );
}
