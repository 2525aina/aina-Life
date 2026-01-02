'use client';

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/features/AppLayout';
import { usePetContext } from '@/contexts/PetContext';
import { useWeights } from '@/hooks/useWeights';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Plus, CalendarIcon, TrendingUp, TrendingDown, Minus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeightPage() {
    const { selectedPet } = usePetContext();
    const { weights, loading, addWeight, deleteWeight } = useWeights(selectedPet?.id || null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [newUnit, setNewUnit] = useState<'kg' | 'g'>('kg');
    const [newDate, setNewDate] = useState<Date>(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const chartData = useMemo(() => [...weights].sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime()).map((w) => ({ date: format(w.date.toDate(), 'M/d'), weight: w.unit === 'g' ? w.value / 1000 : w.value })), [weights]);

    const latestWeight = weights[0];
    const previousWeight = weights[1];
    const weightChange = latestWeight && previousWeight ? (latestWeight.unit === 'g' ? latestWeight.value / 1000 : latestWeight.value) - (previousWeight.unit === 'g' ? previousWeight.value / 1000 : previousWeight.value) : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = parseFloat(newWeight);
        if (isNaN(value) || value <= 0) { toast.error('正しい体重を入力してください'); return; }
        setIsSubmitting(true);
        try { await addWeight({ value, unit: newUnit, date: newDate }); toast.success('体重を記録しました'); setIsDialogOpen(false); setNewWeight(''); }
        catch { toast.error('エラーが発生しました'); }
        finally { setIsSubmitting(false); }
    };

    const handleDelete = async (weightId: string) => { if (!confirm('この記録を削除しますか？')) return; try { await deleteWeight(weightId); toast.success('削除しました'); } catch { toast.error('エラーが発生しました'); } };

    if (!selectedPet) return <AppLayout><div className="p-4 text-center py-12"><p className="text-muted-foreground">ペットを選択してください</p></div></AppLayout>;

    return (
        <AppLayout>
            <div className="p-4 space-y-6">
                <div className="flex items-center justify-between"><h1 className="text-xl font-bold">{selectedPet.name}の体重</h1>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogTrigger asChild><Button size="sm" className="gap-1 gradient-primary"><Plus className="w-4 h-4" />記録</Button></DialogTrigger>
                        <DialogContent><DialogHeader><DialogTitle>体重を記録</DialogTitle></DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                <div className="flex gap-3"><div className="flex-1"><Label htmlFor="weight">体重</Label><Input id="weight" type="number" step="0.01" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="0.00" className="mt-1" /></div>
                                    <div className="w-24"><Label>単位</Label><Select value={newUnit} onValueChange={(v) => setNewUnit(v as 'kg' | 'g')}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="kg">kg</SelectItem><SelectItem value="g">g</SelectItem></SelectContent></Select></div></div>
                                <div><Label>日付</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn('w-full mt-1 justify-start text-left font-normal')}><CalendarIcon className="mr-2 h-4 w-4" />{format(newDate, 'yyyy年M月d日', { locale: ja })}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={newDate} onSelect={(d) => d && setNewDate(d)} locale={ja} /></PopoverContent></Popover></div>
                                <Button type="submit" disabled={isSubmitting} className="w-full gradient-primary">{isSubmitting ? '保存中...' : '保存'}</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
                {latestWeight && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><Card><CardContent className="p-6"><div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">最新の体重</p>
                    <p className="text-4xl font-bold">{latestWeight.value}<span className="text-lg font-normal text-muted-foreground ml-1">{latestWeight.unit}</span></p>
                    <p className="text-sm text-muted-foreground mt-1">{format(latestWeight.date.toDate(), 'M月d日', { locale: ja })}</p>
                    {weightChange !== null && <div className={cn('flex items-center justify-center gap-1 mt-2 text-sm font-medium', weightChange > 0 && 'text-red-500', weightChange < 0 && 'text-green-500', weightChange === 0 && 'text-muted-foreground')}>{weightChange > 0 ? <TrendingUp className="w-4 h-4" /> : weightChange < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}<span>{weightChange > 0 ? '+' : ''}{weightChange.toFixed(2)} kg</span></div>}
                </div></CardContent></Card></motion.div>}
                {chartData.length > 1 && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}><Card><CardHeader className="pb-2"><CardTitle className="text-base">体重の推移</CardTitle></CardHeader><CardContent><div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} domain={['dataMin - 0.5', 'dataMax + 0.5']} /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v) => [`${Number(v).toFixed(2)} kg`, '体重']} /><Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }} /></LineChart></ResponsiveContainer>
                </div></CardContent></Card></motion.div>}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}><Card><CardHeader className="pb-2"><CardTitle className="text-base">履歴</CardTitle></CardHeader><CardContent>
                    {loading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}</div>
                        : weights.length === 0 ? <p className="text-center text-muted-foreground py-6">まだ記録がありません</p>
                            : <div className="space-y-2">{weights.map((w) => <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50"><div><p className="font-medium">{w.value} {w.unit}</p><p className="text-sm text-muted-foreground">{format(w.date.toDate(), 'yyyy年M月d日', { locale: ja })}</p></div><Button variant="ghost" size="icon" onClick={() => handleDelete(w.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button></div>)}</div>}
                </CardContent></Card></motion.div>
            </div>
        </AppLayout>
    );
}
