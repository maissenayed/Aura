import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Header } from '../../components/Header';
import { ResetForm } from './ResetForm';

export const metadata: Metadata = { title: 'Reset password | Aura Calisthenics' };

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-10">
        <Suspense fallback={<div className="w-full max-w-md mx-auto h-72 rounded-2xl border border-slate-800 bg-dark-900/50 animate-pulse" />}>
          <ResetForm />
        </Suspense>
      </main>
    </div>
  );
}
