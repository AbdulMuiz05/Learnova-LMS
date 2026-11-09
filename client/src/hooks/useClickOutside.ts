'use client';

import * as React from 'react';

export function useClickOutside<T extends HTMLElement>(
  onOutside: () => void,
  enabled = true
) {
  const ref = React.useRef<T>(null);
  const callbackRef = React.useRef(onOutside);

  React.useEffect(() => {
    callbackRef.current = onOutside;
  }, [onOutside]);

  React.useEffect(() => {
    if (!enabled) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callbackRef.current();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') callbackRef.current();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [enabled]);

  return ref;
}
