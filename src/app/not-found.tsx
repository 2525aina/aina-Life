import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/features/AppLayout';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <AppLayout>
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
                <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <AlertTriangle className="w-12 h-12 text-orange-500" />
                </div>

                <h2 className="text-3xl font-black mb-2 text-foreground">ページが見つかりません</h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                    お探しのページは削除されたか、URLが変更された可能性があります。
                </p>

                <Link href="/dashboard">
                    <Button className="rounded-full gradient-primary shadow-lg h-12 px-8 text-lg hover:scale-105 transition-transform">
                        <Home className="w-5 h-5 mr-2" />
                        ホームに戻る
                    </Button>
                </Link>
            </div>
        </AppLayout>
    );
}
