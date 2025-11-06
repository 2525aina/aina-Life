"use client";

import { useState, useEffect } from "react";
import { useWeights } from "@/hooks/useWeights";
import type { Weight } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { format, parseISO } from "date-fns";

interface WeightFormProps {
  dogId: string;
  initialWeight?: Weight;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WeightForm({
  dogId,
  initialWeight,
  onSuccess,
  onCancel,
}: WeightFormProps) {
  const { addWeight, updateWeight, loading } = useWeights(dogId);
  const [value, setValue] = useState<number | string>(
    initialWeight?.value || ""
  );
  const [unit, setUnit] = useState<string>(initialWeight?.unit || "kg");
  const [date, setDate] = useState<string>(
    initialWeight?.date
      ? format(initialWeight.date.toDate(), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd")
  );
  const [time, setTime] = useState<string>(
    initialWeight?.date
      ? format(initialWeight.date.toDate(), "HH:mm")
      : format(new Date(), "HH:mm")
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialWeight) {
      setValue(initialWeight.value);
      setUnit(initialWeight.unit);
      setDate(format(initialWeight.date.toDate(), "yyyy-MM-dd"));
      setTime(format(initialWeight.date.toDate(), "HH:mm"));
    }
  }, [initialWeight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (typeof value !== "number" || isNaN(value) || value <= 0) {
      toast.error("有効な体重を入力してください。");
      setIsSubmitting(false);
      return;
    }

    try {
      const recordedAtDate = parseISO(`${date}T${time}`);
      const recordedAtTimestamp = Timestamp.fromDate(recordedAtDate);

      if (initialWeight) {
        await updateWeight(initialWeight.id, {
          value: value,
          unit: unit,
          date: recordedAtTimestamp,
        });
        toast.success("体重記録を更新しました。");
      } else {
        await addWeight({
          value: value,
          unit: unit,
          date: recordedAtTimestamp,
        });
        toast.success("体重記録を追加しました。");
      }
      onSuccess?.();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "体重記録の保存中にエラーが発生しました。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weight-value">体重</Label>
          <Input
            id="weight-value"
            type="number"
            step="0.1"
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight-unit">単位</Label>
          <Input
            id="weight-unit"
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weight-date">日付</Label>
          <Input
            id="weight-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight-time">時刻</Label>
          <Input
            id="weight-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
      </div>
      {/* 体重記録にはnotesフィールドがないため、一旦コメントアウト */}
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || loading}>
          {isSubmitting ? "保存中..." : "保存"}
        </Button>
      </div>
    </form>
  );
}
