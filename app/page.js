'use client';

import { useEffect, useState } from 'react';

const STEP = 30;
const MIN_DURATION = 30;
const MAX_DURATION = 12 * 60;

function minutesToLabel(m) {
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState('');
  const [duration, setDuration] = useState(30);

  const [notifyMinutes, setNotifyMinutes] = useState(60);
  const [notifyInput, setNotifyInput] = useState('60');
  const [pushStatus, setPushStatus] = useState('unsupported'); // unsupported | default | denied | subscribed

  useEffect(() => {
    loadEntries();
    loadSettings();
    checkPushStatus();
  }, []);

  async function loadEntries() {
    try {
      const res = await fetch('/api/systems');
      const data = await res.json();
      setEntries(data);
    } catch (e) {
      console.error('Failed to load systems', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setNotifyMinutes(data.notifyIntervalMinutes);
      setNotifyInput(String(data.notifyIntervalMinutes));
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  }

  async function saveNotifyInterval() {
    const minutes = Math.max(1, Number(notifyInput) || 60);
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifyIntervalMinutes: minutes }),
    });
    const data = await res.json();
    setNotifyMinutes(data.notifyIntervalMinutes);
    setNotifyInput(String(data.notifyIntervalMinutes));
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

  async function checkPushStatus() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setPushStatus('denied');
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    setPushStatus(existing ? 'subscribed' : 'default');
  }

  async function enablePush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushStatus('denied');
        return;
      }

      const keyRes = await fetch('/api/push/public-key');
      const { publicKey } = await keyRes.json();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      setPushStatus('subscribed');
    } catch (e) {
      console.error('Failed to enable push notifications', e);
    }
  }

  async function addEntry() {
    if (!task.trim()) return;
    await fetch('/api/systems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: task.trim(), minutes: duration }),
    });
    setTask('');
    setDuration(30);
    loadEntries();
  }

  async function toggleDone(entry) {
    await fetch(`/api/systems/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !entry.done }),
    });
    loadEntries();
  }

  async function removeEntry(id) {
    await fetch(`/api/systems/${id}`, { method: 'DELETE' });
    loadEntries();
  }

  const sorted = [...entries].sort((a, b) => a.minutes - b.minutes);
  const doneCount = entries.filter((e) => e.done).length;
  const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);
  const doneMinutes = entries
    .filter((e) => e.done)
    .reduce((sum, e) => sum + e.minutes, 0);

  return (
    <div className="wrap">
      <header>
        <div>
          <div className="brand">
            system<span>s</span>
          </div>
          <div className="subtitle">set the time it takes, run the task</div>
        </div>
        <div className="totals">
          {entries.length > 0 && (
            <>
              <strong>{minutesToLabel(doneMinutes)}</strong> /{' '}
              {minutesToLabel(totalMinutes)}
            </>
          )}
        </div>
      </header>

      <div className="notify-row">
        <span className="notify-label">Remind me every</span>
        <input
          type="number"
          min="1"
          className="notify-input"
          value={notifyInput}
          onChange={(e) => setNotifyInput(e.target.value)}
        />
        <span className="notify-label">min</span>
        <button className="notify-save" onClick={saveNotifyInterval}>
          Save
        </button>
        {pushStatus === 'default' && (
          <button className="notify-enable" onClick={enablePush}>
            Enable notifications
          </button>
        )}
        {pushStatus === 'denied' && (
          <span className="notify-status notify-status-denied">
            Notifications blocked in browser settings
          </span>
        )}
        {pushStatus === 'subscribed' && (
          <span className="notify-status">Notifications on</span>
        )}
        {pushStatus === 'unsupported' && (
          <span className="notify-status notify-status-denied">
            Notifications not supported here
          </span>
        )}
      </div>

      <div className="add-row">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="What are you running today?"
          onKeyDown={(e) => {
            if (e.key === 'Enter') addEntry();
          }}
        />
        <div className="duration-stepper">
          <button
            type="button"
            disabled={duration <= MIN_DURATION}
            onClick={() => setDuration((d) => Math.max(MIN_DURATION, d - STEP))}
          >
            −
          </button>
          <div className="duration-value">{minutesToLabel(duration)}</div>
          <button
            type="button"
            disabled={duration >= MAX_DURATION}
            onClick={() => setDuration((d) => Math.min(MAX_DURATION, d + STEP))}
          >
            +
          </button>
        </div>
        <button className="add-btn" onClick={addEntry}>
          Add
        </button>
      </div>

      <div className="timeline">
        {sorted.map((entry) => (
          <div key={entry.id} className={`entry${entry.done ? ' done' : ''}`}>
            <div className="card">
              <div className="duration-chip">{minutesToLabel(entry.minutes)}</div>
              <div className="task">{entry.task}</div>
              <button className="mark" onClick={() => toggleDone(entry)}>
                {entry.done ? 'Undo' : 'Done'}
              </button>
              <button className="remove" onClick={() => removeEntry(entry.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && entries.length === 0 && (
        <div className="empty">
          Nothing scheduled yet. Pick a duration above to bring your first
          system online.
        </div>
      )}

      <div className="status-line">
        <span>
          <span className="signal-dot"></span>
          {entries.length} system{entries.length === 1 ? '' : 's'}
        </span>
        <span>{doneCount} complete</span>
      </div>
    </div>
  );
}
