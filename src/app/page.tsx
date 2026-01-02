'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PawPrint, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <PawPrint className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="w-full max-w-md shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-2">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="mx-auto">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center shadow-lg">
                <PawPrint className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <div>
              <CardTitle className="text-3xl font-bold tracking-tight">aina-life</CardTitle>
              <CardDescription className="text-base mt-2">大切なペットとの日々を、<br />もっと楽しく、もっと素敵に。</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <Button onClick={signInWithGoogle} className="w-full h-12 text-base font-medium gradient-primary hover:opacity-90 transition-opacity">
                <LogIn className="w-5 h-5 mr-2" />Googleでログイン
              </Button>
            </motion.div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-center text-sm text-muted-foreground">
              ログインすると、利用規約とプライバシーポリシーに同意したことになります。
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
