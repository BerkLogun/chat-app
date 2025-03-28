'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/store/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold mb-6">Welcome to Real-Time Chat</h1>
        <p className="text-xl mb-8">
          A modern chat application built with Next.js and Socket.io
        </p>
        <div className="space-x-4">
          <Link href="/auth/login">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="outline" size="lg">Create Account</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
