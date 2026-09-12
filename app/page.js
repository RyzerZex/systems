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

  useEffect(() => {
    loadEntries();
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
            &minus;
          </button>
          <div className="duration-value">{minutesToLabel(duration)}</div>
          <button
            type="button"
            disabled={duration >= MAX_DURATION}
            onClick={() => setDuration((d) => Math.min(MAX_DURATION, d + STEP))}
          >
            &plus;
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
