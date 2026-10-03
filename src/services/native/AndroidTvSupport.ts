/**
 * Android TV & Smart TV Remote Navigation and Focus Management Support.
 * Provides D-Pad spatial navigation, remote key event handling, and synthesized audio feedback.
 */

export type TvKeyDirection = 'up' | 'down' | 'left' | 'right';

export type TvRemoteAction =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'enter'
  | 'back'
  | 'play_pause'
  | 'fast_forward'
  | 'rewind'
  | 'channel_up'
  | 'channel_down'
  | 'menu'
  | 'unknown';

export interface TvRemoteEvent {
  action: TvRemoteAction;
  originalEvent: KeyboardEvent;
  consumed: boolean;
}

export type TvKeyHandler = (event: TvRemoteEvent) => boolean | void;

export interface TvSupportOptions {
  soundEnabled?: boolean;
  spatialNavigation?: boolean;
  activeFocusClassName?: string;
  focusableSelector?: string;
  soundVolume?: number;
}

// Remote Control Key Codes
const KEY_CODES = {
  // D-Pad / Arrows
  UP: [38, 19], // ArrowUp, Android DPAD_UP
  DOWN: [40, 20], // ArrowDown, Android DPAD_DOWN
  LEFT: [37, 21], // ArrowLeft, Android DPAD_LEFT
  RIGHT: [39, 22], // ArrowRight, Android DPAD_RIGHT

  // Enter / OK
  ENTER: [13, 23], // Enter, Android DPAD_CENTER

  // Back
  BACK: [27, 8, 4, 10009, 461], // Escape, Backspace, Android KEYCODE_BACK, Tizen Return, webOS Back

  // Media
  PLAY_PAUSE: [179],
  PLAY: [250, 415],
  PAUSE: [19],
  FAST_FORWARD: [228, 417],
  REWIND: [227, 412],

  // Channels
  CHANNEL_UP: [33, 427],
  CHANNEL_DOWN: [34, 428],
};

const DEFAULT_FOCUSABLE_SELECTOR =
  'button:not([disabled]), [role="button"]:not([aria-disabled="true"]), a[href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [data-tv-focusable="true"]';

let isInitialized = false;
let soundEnabled = true;
let soundVolume = 0.15;
let spatialNavEnabled = true;
let focusClassName = 'tv-focused';
let customSelector = DEFAULT_FOCUSABLE_SELECTOR;

// Key event listeners
const keyListeners = new Set<TvKeyHandler>();
const backListeners = new Set<() => boolean | void>();

// Web Audio API context for zero-latency audio feedback
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a pleasant, low-latency synthesized tick sound on D-pad navigation.
 */
export function playNavigationSound(): void {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(soundVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  } catch {
    // ignore audio errors
  }
}

/**
 * Plays a soft confirmation chime sound on Enter/OK.
 */
export function playConfirmSound(): void {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.04); // E5

    gain.gain.setValueAtTime(soundVolume * 1.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch {
    // ignore
  }
}

/**
 * Plays a soft back/cancel tone on Back press.
 */
export function playBackSound(): void {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.06);

    gain.gain.setValueAtTime(soundVolume * 0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch {
    // ignore
  }
}

/**
 * Maps a KeyboardEvent to a high-level TV Remote Action.
 */
export function mapKeyToTvAction(e: KeyboardEvent): TvRemoteAction {
  const code = e.keyCode || e.which;
  const key = e.key;

  if (key === 'ArrowUp' || key === 'Up' || KEY_CODES.UP.includes(code)) return 'up';
  if (key === 'ArrowDown' || key === 'Down' || KEY_CODES.DOWN.includes(code)) return 'down';
  if (key === 'ArrowLeft' || key === 'Left' || KEY_CODES.LEFT.includes(code)) return 'left';
  if (key === 'ArrowRight' || key === 'Right' || KEY_CODES.RIGHT.includes(code)) return 'right';

  if (key === 'Enter' || key === 'Select' || key === 'Ok' || KEY_CODES.ENTER.includes(code)) {
    return 'enter';
  }

  if (
    key === 'Escape' ||
    key === 'Back' ||
    key === 'GoBack' ||
    key === 'BrowserBack' ||
    KEY_CODES.BACK.includes(code)
  ) {
    // Don't treat Backspace as Back navigation if user is currently typing in an input
    if (key === 'Backspace') {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        return 'unknown';
      }
    }
    return 'back';
  }

  if (
    key === 'MediaPlayPause' ||
    KEY_CODES.PLAY_PAUSE.includes(code) ||
    KEY_CODES.PLAY.includes(code) ||
    KEY_CODES.PAUSE.includes(code)
  ) {
    return 'play_pause';
  }

  if (key === 'MediaFastForward' || KEY_CODES.FAST_FORWARD.includes(code)) return 'fast_forward';
  if (key === 'MediaRewind' || KEY_CODES.REWIND.includes(code)) return 'rewind';
  if (key === 'ChannelUp' || key === 'PageUp' || KEY_CODES.CHANNEL_UP.includes(code)) return 'channel_up';
  if (key === 'ChannelDown' || key === 'PageDown' || KEY_CODES.CHANNEL_DOWN.includes(code)) return 'channel_down';

  return 'unknown';
}

/**
 * Finds all visible focusable elements in the current DOM.
 */
function getFocusableCandidates(): HTMLElement[] {
  if (typeof document === 'undefined') return [];
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(customSelector));

  return nodes.filter((el) => {
    if (!el.isConnected) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
}

/**
 * Geometric Spatial Navigation: Finds the best candidate in the given direction.
 */
function findNearestElementInDirection(
  current: HTMLElement,
  direction: TvKeyDirection
): HTMLElement | null {
  const candidates = getFocusableCandidates().filter((el) => el !== current);
  if (candidates.length === 0) return null;

  const cRect = current.getBoundingClientRect();
  const cCenterX = cRect.left + cRect.width / 2;
  const cCenterY = cRect.top + cRect.height / 2;

  let bestCandidate: HTMLElement | null = null;
  let minDistance = Infinity;

  for (const candidate of candidates) {
    const nRect = candidate.getBoundingClientRect();
    const nCenterX = nRect.left + nRect.width / 2;
    const nCenterY = nRect.top + nRect.height / 2;

    const deltaX = nCenterX - cCenterX;
    const deltaY = nCenterY - cCenterY;

    // Verify candidate is in the requested direction
    let isCorrectDirection = false;
    let primaryDist = 0;
    let secondaryDist = 0;

    switch (direction) {
      case 'left':
        isCorrectDirection = deltaX < -5;
        primaryDist = Math.abs(deltaX);
        secondaryDist = Math.abs(deltaY);
        break;
      case 'right':
        isCorrectDirection = deltaX > 5;
        primaryDist = Math.abs(deltaX);
        secondaryDist = Math.abs(deltaY);
        break;
      case 'up':
        isCorrectDirection = deltaY < -5;
        primaryDist = Math.abs(deltaY);
        secondaryDist = Math.abs(deltaX);
        break;
      case 'down':
        isCorrectDirection = deltaY > 5;
        primaryDist = Math.abs(deltaY);
        secondaryDist = Math.abs(deltaX);
        break;
    }

    if (!isCorrectDirection) continue;

    // Weight secondary distance higher to favor collinear elements
    const distance = Math.hypot(primaryDist, secondaryDist * 2.2);

    if (distance < minDistance) {
      minDistance = distance;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

/**
 * Applies visual TV focus indicator and scrolls into view.
 */
export function applyTvFocus(element: HTMLElement): void {
  // Remove old TV focus classes
  document.querySelectorAll(`.${focusClassName}`).forEach((el) => {
    el.classList.remove(focusClassName);
    el.removeAttribute('data-tv-focused');
  });

  element.classList.add(focusClassName);
  element.setAttribute('data-tv-focused', 'true');
  element.focus({ preventScroll: true });

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest',
  });
}

/**
 * Global Keyboard Event Handler for TV Remote inputs.
 */
function handleKeyDown(e: KeyboardEvent): void {
  const action = mapKeyToTvAction(e);
  if (action === 'unknown') return;

  const eventObj: TvRemoteEvent = {
    action,
    originalEvent: e,
    consumed: false,
  };

  // 1. Dispatch to custom key listeners
  for (const listener of keyListeners) {
    const handled = listener(eventObj);
    if (handled === true || eventObj.consumed) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }

  // 2. Handle Back Button
  if (action === 'back') {
    playBackSound();
    for (const backHandler of backListeners) {
      const handled = backHandler();
      if (handled === true) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }
    // Default Back behavior: history.back()
    if (typeof window !== 'undefined' && window.history.length > 1) {
      e.preventDefault();
      window.history.back();
    }
    return;
  }

  // 3. Handle Enter/OK Key
  if (action === 'enter') {
    playConfirmSound();
    const active = document.activeElement as HTMLElement | null;
    if (active && active !== document.body) {
      // Simulate click if active element is a button/link/focusable
      active.click();
      e.preventDefault();
    }
    return;
  }

  // 4. Handle Spatial D-Pad Navigation (up, down, left, right)
  if (
    spatialNavEnabled &&
    (action === 'up' || action === 'down' || action === 'left' || action === 'right')
  ) {
    const active = (document.activeElement as HTMLElement) || document.body;

    // Don't intercept left/right inside text inputs if cursor isn't at edge
    if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') {
      return;
    }

    const next = findNearestElementInDirection(active, action);
    if (next) {
      e.preventDefault();
      e.stopPropagation();
      applyTvFocus(next);
      playNavigationSound();
    } else {
      // If no active element was selected yet, focus the first candidate
      const candidates = getFocusableCandidates();
      if (candidates.length > 0 && active === document.body) {
        e.preventDefault();
        applyTvFocus(candidates[0]);
        playNavigationSound();
      }
    }
  }
}

/**
 * Initializes Android TV Remote Navigation and Focus Manager.
 */
export function initTvSupport(options: TvSupportOptions = {}): void {
  if (isInitialized) return;

  if (options.soundEnabled !== undefined) soundEnabled = options.soundEnabled;
  if (options.soundVolume !== undefined) soundVolume = options.soundVolume;
  if (options.spatialNavigation !== undefined) spatialNavEnabled = options.spatialNavigation;
  if (options.activeFocusClassName) focusClassName = options.activeFocusClassName;
  if (options.focusableSelector) customSelector = options.focusableSelector;

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown, true);
    isInitialized = true;
  }
}

/**
 * Cleans up TV listeners.
 */
export function destroyTvSupport(): void {
  if (!isInitialized) return;
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown, true);
  }
  keyListeners.clear();
  backListeners.clear();
  isInitialized = false;
}

/**
 * Register a listener for TV remote actions.
 */
export function onRemoteKey(handler: TvKeyHandler): () => void {
  keyListeners.add(handler);
  return () => {
    keyListeners.delete(handler);
  };
}

/**
 * Register a listener for the TV Back button.
 * Return `true` in handler to consume the event and prevent default back action.
 */
export function onTvBack(handler: () => boolean | void): () => void {
  backListeners.add(handler);
  return () => {
    backListeners.delete(handler);
  };
}

/**
 * Enable or disable synthesized audio feedback.
 */
export function setAudioFeedback(enabled: boolean): void {
  soundEnabled = enabled;
}

/**
 * Set audio volume (0.0 to 1.0).
 */
export function setAudioVolume(volume: number): void {
  soundVolume = Math.max(0, Math.min(1, volume));
}

/**
 * Injects TV focus CSS styles dynamically to give a TV glow/border to focused elements.
 */
export function injectTvFocusStyles(): void {
  if (typeof document === 'undefined') return;
  const styleId = 'matv-tv-focus-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .${focusClassName}, [data-tv-focused="true"] {
      outline: 3px solid #3b82f6 !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.6) !important;
      transform: scale(1.03) !important;
      transition: transform 0.15s ease-out, outline 0.15s ease-out, box-shadow 0.15s ease-out !important;
      z-index: 50 !important;
    }
  `;
  document.head.appendChild(style);
}

export const AndroidTvSupport = {
  init: initTvSupport,
  destroy: destroyTvSupport,
  onKey: onRemoteKey,
  onBack: onTvBack,
  playNavigationSound,
  playConfirmSound,
  playBackSound,
  applyTvFocus,
  setAudioFeedback,
  setAudioVolume,
  injectTvFocusStyles,
  mapKeyToTvAction,
};

export default AndroidTvSupport;
