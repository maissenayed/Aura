import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Header } from '../../components/Header';
import { JoinForm } from './JoinForm';

export const metadata: Metadata = { title: 'Join | Aura Calisthenics' };

export default function JoinPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-10">
        {/* The invitation code is read from the URL, which only exists in the browser. */}
        <Suspense fallback={<div className="w-full max-w-md mx-auto h-80 rounded-2xl border border-slate-800 bg-dark-900/50 animate-pulse" />}>
          <JoinForm />
        </Suspense>
      </main>
    </div>
  );
}
