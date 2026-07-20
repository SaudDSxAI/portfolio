import { useState } from 'react';
import {
  MonitorPlay, LayoutDashboard, Users, LogOut, BadgeCheck, UserX, CameraOff,
  Play, Square, Calendar, CheckCircle2, XCircle, UploadCloud, CheckCircle,
  Loader2, Image as ImageIcon, Activity,
} from 'lucide-react';

// No real screenshots exist for this one — it needs a real webcam and a local
// ML backend (YOLOv8n-face + DeepFace), so it can never run as an actual live
// demo on this deployed site. Rather than fabricate generic "AI dashboard"
// stock-photo-style mockup art, this is rebuilt directly from the project's
// real React components (App.jsx, LiveFeed.jsx, AttendanceTable.jsx,
// Enrollment.jsx) — same dark palette, same copy, same layout, same states.
// It's a faithful recreation of the real UI, not a screenshot, and not
// invented from scratch.

const MOCK_ATTENDANCE = [
  { name: 'Ahmed Khan', time: '08:31:07', type: 'entry', confidence: 91 },
  { name: 'Sara Ali', time: '08:29:44', type: 'entry', confidence: 87 },
  { name: 'Bilal Ahmed', time: '14:02:19', type: 'exit', confidence: 84 },
];

const MOCK_QUEUE = [
  { name: 'Ahmed Khan', status: 'success', message: 'Enrolled successfully' },
  { name: 'Sara Ali', status: 'uploading', message: 'Extracting face...' },
  { name: 'Zainab Malik', status: 'pending', message: 'Ready' },
];

function DashboardPreview() {
  const [detecting, setDetecting] = useState(false);

  return (
    <div className="px-5 pt-6 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Live Monitoring</h1>
          <p className="text-zinc-400 text-xs mt-1">Real-time AI face detection and attendance logging.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg px-3 py-2 flex items-center gap-2">
            <Activity size={14} className="text-emerald-400" />
            <div>
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider">System</p>
              <p className="text-xs font-semibold text-emerald-400">Online</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Live feed */}
        <div className="lg:col-span-3 bg-zinc-950/60 border border-zinc-800 rounded-xl p-2 relative">
          <div className="flex justify-between items-center bg-zinc-950/80 px-3 py-2 rounded-lg border border-zinc-800 mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${detecting ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
              <span className="text-zinc-200 text-[10px] font-semibold tracking-wide">
                {detecting ? 'LIVE FEED / SCANNING' : 'STANDBY'}
              </span>
            </div>
            <button
              onClick={() => setDetecting((d) => !d)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium text-[10px] border transition-colors ${
                detecting
                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
              }`}
            >
              {detecting ? <><Square size={10} fill="currentColor" /> Stop</> : <><Play size={10} fill="currentColor" /> Start Detection</>}
            </button>
          </div>

          <div className="relative aspect-[16/10] w-full bg-[#050505] rounded-lg overflow-hidden flex items-center justify-center border border-zinc-900">
            {detecting ? (
              <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-500/40 animate-pulse" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-600">
                <CameraOff size={24} />
                <p className="text-[10px] font-medium">Camera is on standby</p>
              </div>
            )}

            {detecting && (
              <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
                <div className="px-2.5 py-2 rounded-lg flex items-center gap-2 bg-zinc-950/90 border border-emerald-500/30">
                  <BadgeCheck size={15} className="text-emerald-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-zinc-100 text-[11px]">Ahmed Khan</span>
                    <span className="text-[9px] text-emerald-400/80">Match: 91.0%</span>
                  </div>
                </div>
                <div className="px-2.5 py-2 rounded-lg flex items-center gap-2 bg-zinc-950/90 border border-red-500/30">
                  <UserX size={15} className="text-red-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-zinc-100 text-[11px]">Unknown</span>
                    <span className="text-[9px] text-red-400/80">Match: 22.4%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Attendance table */}
        <div className="lg:col-span-2 bg-zinc-950/60 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2 border-b border-zinc-800">
            <Calendar size={14} className="text-zinc-400" />
            <h3 className="text-xs font-semibold text-zinc-100">Recent Activity</h3>
          </div>
          <div className="flex-1 p-3 space-y-2">
            {MOCK_ATTENDANCE.map((r) => (
              <div key={r.name} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="flex flex-col">
                  <span className="font-semibold text-zinc-100 text-[11px]">{r.name}</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5">{r.time}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-1.5 py-0.5 flex items-center gap-1 text-[8px] font-bold uppercase rounded border ${
                    r.type === 'entry' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {r.type === 'entry' ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                    {r.type}
                  </span>
                  <span className="text-[9px] text-zinc-500">Confidence: {r.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EnrollmentPreview() {
  return (
    <div className="px-5 pt-6 pb-6">
      <div className="flex justify-between items-end mb-5">
        <div>
          <h2 className="text-lg font-bold text-zinc-50 tracking-tight">Bulk Enrollment</h2>
          <p className="text-zinc-400 text-xs mt-1">Upload facial profiles to register them into the system.</p>
        </div>
        <button className="px-4 py-2 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-900">Start Enrollment</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/40 flex flex-col items-center justify-center text-center py-10 px-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-3">
            <UploadCloud size={20} className="text-zinc-300" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-100 mb-1">Drag & Drop Images</h3>
          <p className="text-zinc-400 text-[11px] mb-4 max-w-xs">Select multiple images at once. The filename becomes the person's name.</p>
          <button className="px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-200 text-[11px] font-medium">Browse Files</button>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-zinc-200 mb-3 border-b border-zinc-800 pb-2">Queue ({MOCK_QUEUE.length})</h3>
          <div className="space-y-2">
            {MOCK_QUEUE.map((f) => (
              <div key={f.name} className="bg-zinc-900 rounded-lg p-2 flex items-center gap-2.5 border border-zinc-800">
                <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                  <ImageIcon size={11} className="text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-zinc-200 truncate">{f.name}</p>
                  <p className="text-[9px] text-zinc-500 truncate">{f.message}</p>
                </div>
                {f.status === 'uploading' && <Loader2 size={13} className="text-zinc-400 animate-spin shrink-0" />}
                {f.status === 'success' && <CheckCircle size={13} className="text-emerald-500 shrink-0" />}
                {f.status === 'pending' && <XCircle size={13} className="text-zinc-600 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AttendanceUIPreview() {
  const [tab, setTab] = useState('dashboard');

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-4">
        Rebuilt directly from the real component code, same dark theme, same copy, same states — not a screenshot,
        since this needs a real webcam and a local ML backend that can't run on this deployed site. Click "Start
        Detection" to see the live-feed state.
      </p>

      <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
        {/* Recreated sidebar + tab switcher standing in for real routing */}
        <div className="bg-[#09090b] flex">
          <div className="w-40 shrink-0 border-r border-zinc-800/50 hidden sm:flex flex-col py-5 px-3">
            <div className="flex items-center gap-2 px-1 mb-6">
              <MonitorPlay size={16} className="text-zinc-50" />
              <span className="text-sm font-bold text-white">AMS<span className="text-zinc-500 font-normal">.ai</span></span>
            </div>
            <button
              onClick={() => setTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-1 transition-colors ${tab === 'dashboard' ? 'bg-zinc-800 text-zinc-50 font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <LayoutDashboard size={14} /> Dashboard
            </button>
            <button
              onClick={() => setTab('enrollment')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-1 transition-colors ${tab === 'enrollment' ? 'bg-zinc-800 text-zinc-50 font-medium' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Users size={14} /> Enrollment
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-2 px-3 py-2 text-zinc-500 text-xs">
              <LogOut size={14} /> Logout
            </div>
          </div>

          {/* Mobile tab switcher */}
          <div className="sm:hidden absolute top-2 right-2 z-10 flex gap-1 bg-zinc-900/80 rounded-lg p-1">
            <button onClick={() => setTab('dashboard')} className={`px-2 py-1 rounded text-[10px] ${tab === 'dashboard' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}>Dashboard</button>
            <button onClick={() => setTab('enrollment')} className={`px-2 py-1 rounded text-[10px] ${tab === 'enrollment' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}>Enrollment</button>
          </div>

          <div className="flex-1 min-w-0">
            {tab === 'dashboard' ? <DashboardPreview /> : <EnrollmentPreview />}
          </div>
        </div>
      </div>
    </div>
  );
}
