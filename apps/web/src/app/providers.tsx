'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GameProvider } from '../components/game/GameProvider';
import { SignInWall } from '../components/account/SignInWall';
import { OfflineStatus } from '../components/pwa/OfflineStatus';
import { ExerciseListLoader } from '../utils/exerciseListStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ExerciseListLoader />
      <GameProvider>
        <SignInWall>{children}</SignInWall>
        <OfflineStatus />
      </GameProvider>
    </QueryClientProvider>
  );
}
