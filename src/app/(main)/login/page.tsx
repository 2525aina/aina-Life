'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    const processSignIn = async () => {
      try {
        if (isSignInWithEmailLink(auth, window.location.href)) {
            if (auth.currentUser) {
                return;
            }

            setLoading(true);
            let emailFromStorage = window.localStorage.getItem('emailForSignIn');
            if (!emailFromStorage) {
              emailFromStorage = window.prompt('確認のため、メールアドレスを再度入力してください。');
            }

            if (emailFromStorage) {
                await signInWithEmailLink(auth, emailFromStorage, window.location.href);
                window.localStorage.removeItem('emailForSignIn');
                window.history.replaceState({}, document.title, window.location.pathname);
                toast.success('ログインしました！');
                router.push('/');
            } else {
                toast.error('メールアドレスが確認できませんでした。');
                setLoading(false);
            }
        }
      } catch (err) {
        const isFirebaseError = typeof err === 'object' && err !== null && 'code' in err;
        const message = err instanceof Error ? err.message : String(err);

        if (isFirebaseError && (err as {code: string}).code === 'auth/invalid-action-code') {
            toast.error('このログインリンクは無効です。有効期限が切れているか、既に使用されています。');
        } else {
            toast.error(`ログインに失敗しました: ${message}`);
        }
        setLoading(false);
      }
    };

    if (!authLoading) {
        processSignIn();
    }
  }, [authLoading, router]);


  const handleEmailLogin = async () => {
    setLoading(true);

    if (!emailRegex.test(email)) {
        toast.error("有効なメールアドレスを入力してください。");
        setLoading(false);
        return;
    }

    const actionCodeSettings = {
      url: `${window.location.origin}/login`,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      toast.success(`${email} にログインリンクを送信しました。迷惑メールフォルダもご確認ください。`);
      setEmail("");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`ログインリンクの送信に失敗しました: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Googleでログインしました！");
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Googleでのログインに失敗しました: ${message}`);
    } finally {
        setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`ゲストログインに失敗しました: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">ログイン</CardTitle>
          <CardDescription>
            メールアドレスを入力してログインリンクを受け取ってください。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={handleEmailLogin} disabled={loading}>
            {loading ? '送信中...' : 'ログインリンクを送信'}
          </Button>
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
            Googleでログイン
          </Button>
          <Button variant="secondary" className="w-full" onClick={handleAnonymousLogin} disabled={loading}>
            ゲストとして試す
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}