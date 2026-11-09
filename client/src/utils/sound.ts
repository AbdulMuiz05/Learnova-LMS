const SOUND_KEY = 'lms:notification-sound';

export function isNotificationSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(SOUND_KEY) !== 'off';
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off');
}

export function playNotificationSound(): void {
  if (typeof window === 'undefined' || !isNotificationSoundEnabled()) return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.45);
    gain.connect(context.destination);

    const first = context.createOscillator();
    first.type = 'sine';
    first.frequency.setValueAtTime(880, context.currentTime);
    first.connect(gain);
    first.start(context.currentTime);
    first.stop(context.currentTime + 0.18);

    const second = context.createOscillator();
    second.type = 'sine';
    second.frequency.setValueAtTime(1174.66, context.currentTime + 0.16);
    second.connect(gain);
    second.start(context.currentTime + 0.16);
    second.stop(context.currentTime + 0.45);

    window.setTimeout(() => {
      context.close().catch(() => undefined);
    }, 700);
  } catch {
    // Sound is a progressive enhancement; browsers may block audio without a gesture.
  }
}
