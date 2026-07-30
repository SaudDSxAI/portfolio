import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'private_portal_token';
const EXPIRY_KEY = 'private_portal_expires_at';
// Client-side inactivity logout — on top of the server's own hard token
// expiry (2 hours). Whichever hits first wins.
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function LoginGate({ onAuthed }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/private/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Wrong email or password');
      }
      const { token, expires_in } = await res.json();
      const expiresAt = Date.now() + expires_in * 1000;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(EXPIRY_KEY, String(expiresAt));
      onAuthed(token);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl border border-black/10 shadow-lg p-6">
        <h1 className="text-lg font-heading font-bold text-black mb-1">Private</h1>
        <p className="text-sm text-zinc-600 mb-4">Not part of the public site. Session expires after 2 hours, or after 15 minutes idle.</p>
        <input
          type="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="username"
          className="w-full px-3 py-2.5 rounded-xl border border-black/15 focus:border-primary-500 outline-none text-sm mb-2"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="w-full px-3 py-2.5 rounded-xl border border-black/15 focus:border-primary-500 outline-none text-sm mb-3"
        />
        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl font-semibold text-white bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 disabled:opacity-60 transition-all"
        >
          {loading ? 'Checking...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

const STATUS_OPTIONS = ['Applied', 'Interviewing', 'Offer', 'Rejected', 'Ghosted'];
const STATUS_COLORS = {
  Applied: 'bg-zinc-100 text-zinc-700',
  Interviewing: 'bg-blue-100 text-blue-700',
  Offer: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700',
  Ghosted: 'bg-amber-100 text-amber-700',
};

function SummaryPanel({ token }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/private/summary`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {});
  }, [token]);

  if (!summary) return null;

  const cards = [
    { label: 'Applications', value: summary.total_applications },
    { label: 'Response rate', value: `${summary.response_rate}%` },
    { label: 'Prep done', value: `${summary.prep_completed}/${summary.prep_total}` },
    { label: 'Notes', value: summary.total_notes },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-xl border border-black/10 p-4">
          <div className="text-2xl font-heading font-bold text-black">{c.value}</div>
          <div className="text-xs text-zinc-500 mt-0.5">{c.label}</div>
        </div>
      ))}
      {Object.keys(summary.status_counts || {}).length > 0 && (
        <div className="col-span-2 sm:col-span-4 flex flex-wrap gap-2 mt-1">
          {Object.entries(summary.status_counts).map(([status, count]) => (
            <span key={status} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[status] || 'bg-zinc-100 text-zinc-700'}`}>
              {status}: {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationsTab({ token }) {
  const [apps, setApps] = useState([]);
  const [form, setForm] = useState({ company: '', role: '', status: 'Applied', link: '', notes: '' });

  const refresh = useCallback(() => {
    fetch(`${API_URL}/api/private/applications`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then(setApps)
      .catch(() => {});
  }, [token]);

  useEffect(refresh, [refresh]);

  const add = async (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) return;
    await fetch(`${API_URL}/api/private/applications`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(form),
    });
    setForm({ company: '', role: '', status: 'Applied', link: '', notes: '' });
    refresh();
  };

  const setStatus = async (app, status) => {
    await fetch(`${API_URL}/api/private/applications/${app.id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ ...app, status }),
    });
    refresh();
  };

  const remove = async (id) => {
    await fetch(`${API_URL}/api/private/applications/${id}`, { method: 'DELETE', headers: authHeaders(token) });
    refresh();
  };

  return (
    <div>
      <form onSubmit={add} className="grid sm:grid-cols-5 gap-2 mb-5">
        <input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="px-3 py-2 rounded-lg border border-black/15 text-sm" />
        <input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="px-3 py-2 rounded-lg border border-black/15 text-sm" />
        <input placeholder="Link" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="px-3 py-2 rounded-lg border border-black/15 text-sm" />
        <input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="px-3 py-2 rounded-lg border border-black/15 text-sm" />
        <button type="submit" className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors">Add</button>
      </form>

      <div className="space-y-2">
        {apps.map((app) => (
          <div key={app.id} className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-black/10 px-4 py-3">
            <div className="flex-1 min-w-[160px]">
              <div className="font-semibold text-sm text-black">{app.company}</div>
              <div className="text-xs text-zinc-500">{app.role}{app.date_applied ? ` · ${app.date_applied}` : ''}</div>
              {app.notes && <div className="text-xs text-zinc-400 mt-0.5">{app.notes}</div>}
            </div>
            <select
              value={app.status}
              onChange={(e) => setStatus(app, e.target.value)}
              className={`text-xs font-semibold px-2 py-1 rounded-full border-0 outline-none ${STATUS_COLORS[app.status] || 'bg-zinc-100'}`}
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {app.link && (
              <a href={app.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">link</a>
            )}
            <button onClick={() => remove(app.id)} className="text-xs text-zinc-400 hover:text-red-600">remove</button>
          </div>
        ))}
        {apps.length === 0 && <p className="text-sm text-zinc-500">No applications yet.</p>}
      </div>
    </div>
  );
}

function PrepTab({ token }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', category: 'General', notes: '' });

  const refresh = useCallback(() => {
    fetch(`${API_URL}/api/private/prep`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }, [token]);

  useEffect(refresh, [refresh]);

  const add = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await fetch(`${API_URL}/api/private/prep`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(form),
    });
    setForm({ title: '', category: 'General', notes: '' });
    refresh();
  };

  const toggle = async (item) => {
    await fetch(`${API_URL}/api/private/prep/${item.id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ ...item, done: !item.done }),
    });
    refresh();
  };

  const remove = async (id) => {
    await fetch(`${API_URL}/api/private/prep/${id}`, { method: 'DELETE', headers: authHeaders(token) });
    refresh();
  };

  return (
    <div>
      <form onSubmit={add} className="grid sm:grid-cols-4 gap-2 mb-5">
        <input placeholder="Task" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-3 py-2 rounded-lg border border-black/15 text-sm sm:col-span-2" />
        <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 rounded-lg border border-black/15 text-sm" />
        <button type="submit" className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors">Add</button>
      </form>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl border border-black/10 px-4 py-3">
            <input type="checkbox" checked={item.done} onChange={() => toggle(item)} className="w-4 h-4 accent-primary-600" />
            <div className="flex-1">
              <span className={`text-sm font-medium ${item.done ? 'line-through text-zinc-400' : 'text-black'}`}>{item.title}</span>
              <span className="text-xs text-zinc-400 ml-2">{item.category}</span>
            </div>
            <button onClick={() => remove(item.id)} className="text-xs text-zinc-400 hover:text-red-600">remove</button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-zinc-500">No prep items yet.</p>}
      </div>
    </div>
  );
}

function NotesTab({ token }) {
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', tag: '' });

  const refresh = useCallback(() => {
    fetch(`${API_URL}/api/private/notes`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then(setNotes)
      .catch(() => {});
  }, [token]);

  useEffect(refresh, [refresh]);

  const add = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await fetch(`${API_URL}/api/private/notes`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(form),
    });
    setForm({ title: '', body: '', tag: '' });
    refresh();
  };

  const remove = async (id) => {
    await fetch(`${API_URL}/api/private/notes/${id}`, { method: 'DELETE', headers: authHeaders(token) });
    refresh();
  };

  return (
    <div>
      <form onSubmit={add} className="space-y-2 mb-5">
        <div className="grid sm:grid-cols-4 gap-2">
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-3 py-2 rounded-lg border border-black/15 text-sm sm:col-span-3" />
          <input placeholder="Tag" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="px-3 py-2 rounded-lg border border-black/15 text-sm" />
        </div>
        <textarea placeholder="Note" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-black/15 text-sm" />
        <button type="submit" className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors">Add note</button>
      </form>

      <div className="space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="bg-white rounded-xl border border-black/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-black">{note.title}</span>
              <button onClick={() => remove(note.id)} className="text-xs text-zinc-400 hover:text-red-600">remove</button>
            </div>
            {note.body && <p className="text-sm text-zinc-600 mt-1 whitespace-pre-wrap">{note.body}</p>}
            {note.tag && <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">{note.tag}</span>}
          </div>
        ))}
        {notes.length === 0 && <p className="text-sm text-zinc-500">No notes yet.</p>}
      </div>
    </div>
  );
}

const TABS = [
  { key: 'applications', label: 'Applications' },
  { key: 'prep', label: 'Prep' },
  { key: 'notes', label: 'Notes' },
];

function isExpired() {
  const expiresAt = Number(localStorage.getItem(EXPIRY_KEY) || 0);
  return !expiresAt || Date.now() > expiresAt;
}

export default function PrivatePage() {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored && !isExpired() ? stored : null;
  });
  const [tab, setTab] = useState('applications');
  const [timedOut, setTimedOut] = useState(false);

  const logout = useCallback((reason) => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    setToken(null);
    setTimedOut(Boolean(reason));
  }, []);

  // Server-enforced hard expiry — checked periodically, logs out the moment
  // the token would stop working on the backend anyway.
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      if (isExpired()) logout('expired');
    }, 15000);
    return () => clearInterval(interval);
  }, [token, logout]);

  // Client-side inactivity timeout — resets on any real interaction.
  useEffect(() => {
    if (!token) return;
    let idleTimer = setTimeout(() => logout('idle'), IDLE_TIMEOUT_MS);
    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => logout('idle'), IDLE_TIMEOUT_MS);
    };
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    return () => {
      clearTimeout(idleTimer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [token, logout]);

  const handleAuthed = (newToken) => {
    setTimedOut(false);
    setToken(newToken);
  };

  if (!token) {
    return (
      <div>
        {timedOut && (
          <p className="text-center text-xs text-amber-700 bg-amber-50 border-b border-amber-200 py-2">
            Session ended, sign in again.
          </p>
        )}
        <LoginGate onAuthed={handleAuthed} />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-heading font-bold text-black">Private</h1>
        <button onClick={() => logout()} className="text-xs text-zinc-500 hover:text-red-600">log out</button>
      </div>

      <SummaryPanel token={token} />

      <div className="flex gap-2 mb-5 border-b border-black/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.key ? 'border-primary-600 text-black' : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'applications' && <ApplicationsTab token={token} />}
      {tab === 'prep' && <PrepTab token={token} />}
      {tab === 'notes' && <NotesTab token={token} />}
    </div>
  );
}
