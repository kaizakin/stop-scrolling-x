import { useEffect, useState } from 'react';

const DEFAULT_MINUTES = 30;
const STORAGE_KEY = 'blockState';

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

function createState(minutes) {
  const durationMs = Math.max(1, Number(minutes) || DEFAULT_MINUTES) * 60 * 1000;
  const endTime = Date.now() + durationMs;

  return {
    active: true,
    durationMs,
    endTime,
    startedAt: Date.now(),
  };
}

export default function App() {
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [blockState, setBlockState] = useState({
    active: false,
    durationMs: 0,
    endTime: null,
    startedAt: null,
  });
  const [now, setNow] = useState(Date.now());

  const emptyState = {
    active: false,
    durationMs: 0,
    endTime: null,
    startedAt: null,
  };

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (result[STORAGE_KEY]) {
        setBlockState(result[STORAGE_KEY]);
      }
    });

    const handleChanges = (changes, area) => {
      if (area === 'local' && changes[STORAGE_KEY]?.newValue) {
        setBlockState(changes[STORAGE_KEY].newValue);
      }

      if (area === 'local' && changes[STORAGE_KEY]?.newValue === null) {
        setBlockState(emptyState);
      }
    };

    chrome.storage.onChanged.addListener(handleChanges);

    return () => {
      chrome.storage.onChanged.removeListener(handleChanges);
    };
  }, []);

  useEffect(() => {
    if (!blockState.active) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [blockState.active]);

  const remainingMs =
    blockState.active && blockState.endTime ? Math.max(0, blockState.endTime - now) : 0;

  const progress =
    blockState.active && blockState.durationMs
      ? Math.min(
          100,
          Math.max(0, ((blockState.durationMs - remainingMs) / blockState.durationMs) * 100),
        )
      : 0;

  const startTimer = () => {
    const nextState = createState(minutes);
    chrome.storage.local.set({ [STORAGE_KEY]: nextState }, () => {
      setBlockState(nextState);
      setNow(Date.now());
    });
  };

  return (
    <main className="min-h-[320px] w-[300px] bg-white font-body text-slate-900">
      <section className="flex min-h-[320px] flex-col gap-5 p-4">
        <header className="space-y-1 border-b border-slate-200 pb-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">
            Stop Scrolling
          </p>
          <h1 className="font-display text-xl text-slate-950">Block X for a fixed time</h1>
          <p className="text-xs leading-5 text-slate-500">
            Opening `x.com` during the timer will close the tab.
          </p>
        </header>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</span>
            <span className="rounded-full border border-slate-300 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-700">
              {blockState.active ? 'Blocking' : 'Idle'}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Remaining</p>
            <p className="mt-2 font-display text-3xl tracking-tight text-slate-950">
              {blockState.active ? formatDuration(remainingMs) : '00:00:00'}
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-slate-900 transition-[width] duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="minutes"
            className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500"
          >
            Timer
          </label>
          <div className="flex items-center gap-2">
            <input
              id="minutes"
              type="number"
              min="1"
              step="1"
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              disabled={blockState.active}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none transition focus:border-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            />
            <span className="text-sm text-slate-500">min</span>
          </div>
          <button
            type="button"
            onClick={startTimer}
            disabled={blockState.active}
            className="w-full rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Start timer
          </button>
        </div>

        <p className="mt-auto text-[11px] leading-5 text-slate-500">
          Once started, the timer cannot be stopped early.
        </p>
      </section>
    </main>
  );
}
