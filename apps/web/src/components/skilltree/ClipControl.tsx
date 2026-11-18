'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Video } from 'lucide-react';
import { useGame } from '../game/GameProvider';
import { commitSave, peekSave } from '../../utils/protocolStore';
import { loadClip, saveClip } from '../../utils/clipStore';
import { toIsoDate } from '../../utils/protocolEngine';

/**
 * Film the test set: a clip for form, kept on this phone. The badge shows it
 * was filmed. On a phone the picker offers the camera directly.
 */
export const ClipControl: React.FC<{ skillKey: string }> = ({ skillKey }) => {
  const { save, todayIso } = useGame();
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const filmed = save.clips?.[skillKey];

  useEffect(() => {
    if (!filmed) return;
    let live = true;
    let made: string | null = null;
    void loadClip(skillKey).then((blob) => {
      if (!live || !blob) return;
      made = URL.createObjectURL(blob);
      setUrl(made);
    });
    return () => {
      live = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [filmed, skillKey]);

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={input}
        type="file"
        accept="video/*"
        capture="environment"
        className="sr-only"
        aria-label="Film or choose a clip of the test"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const ok = await saveClip(skillKey, file);
          setFailed(!ok);
          if (!ok) return;
          const current = peekSave();
          commitSave({ ...current, clips: { ...(current.clips ?? {}), [skillKey]: todayIso ?? toIsoDate(new Date()) } });
          setUrl(URL.createObjectURL(file));
        }}
      />
      {url && <video src={url} controls playsInline className="w-full max-h-[240px] rounded-card bg-ink-950" />}
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="self-start h-9 px-3 rounded-card border border-ink-600 text-fg-2 text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer"
      >
        <Video className="w-3.5 h-3.5" /> {filmed ? `Filmed ${filmed} · replace` : 'Film the test set'}
      </button>
      <p className="text-[11.5px] text-fg-4">{failed ? 'This browser would not keep the clip. Try a shorter one.' : 'For your form first. Clips stay on this phone.'}</p>
    </div>
  );
};
