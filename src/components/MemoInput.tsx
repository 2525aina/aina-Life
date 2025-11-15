"use client";

import { Textarea } from '@/components/ui/textarea';

interface MemoInputProps {
  memo: string;
  setMemo: (memo: string) => void;
}

export function MemoInput({ memo, setMemo }: MemoInputProps) {
  return (
    <Textarea
      id="memo-input"
      name="memo-input"
      value={memo}
      onChange={(e) => setMemo(e.target.value)}
      placeholder="メモ..."
    />
  );
}
