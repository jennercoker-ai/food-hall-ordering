'use client';

import { useState } from 'react';
import { useGroupSession } from '@/store/groupSession';

export default function GroupSessionSetup({ onClose }: { onClose: () => void }) {
  const { initGroup, joinGroup, addGuest, guests } = useGroupSession();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [groupName, setGroupName] = useState('Our Group');
  const [hostName, setHostName] = useState('');
  const [guestNames, setGuestNames] = useState<string[]>(['']);
  const [joinId, setJoinId] = useState('');
  const [guestName, setGuestName] = useState('');

  const handleCreate = () => {
    if (!hostName.trim()) return;
    initGroup(groupName, hostName);
    guestNames.filter((n) => n.trim()).forEach((n) => addGuest(n));
    onClose();
  };

  const handleJoin = () => {
    if (!joinId.trim() || !guestName.trim()) return;
    joinGroup(joinId, 'Group', guestName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-pink-600 text-white px-5 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">👨‍👩‍👧‍👦 Group Order</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">×</button>
        </div>

        <div className="p-5">
          {mode === 'choose' && (
            <div className="space-y-3">
              <p className="text-gray-600 text-sm">Order together with friends and family. Everyone adds their own items, the host pays.</p>
              <button
                onClick={() => setMode('create')}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:opacity-90 transition"
              >
                👑 Start a New Group
              </button>
              <button
                onClick={() => setMode('join')}
                className="w-full py-4 bg-white border-2 border-gray-200 text-gray-800 rounded-xl font-semibold hover:border-purple-300 transition"
              >
                🚪 Join Existing Group
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-3">
              <button onClick={() => setMode('choose')} className="text-sm text-purple-600 hover:underline">← Back</button>
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name (e.g. The Smiths)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Your name (Host) *"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 font-medium">Add other guests (optional):</p>
              {guestNames.map((name, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={name}
                    onChange={(e) => {
                      const updated = [...guestNames];
                      updated[i] = e.target.value;
                      setGuestNames(updated);
                    }}
                    placeholder={`Guest ${i + 1} name`}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {guestNames.length > 1 && (
                    <button onClick={() => setGuestNames(guestNames.filter((_, j) => j !== i))} className="text-red-400 px-2">×</button>
                  )}
                </div>
              ))}
              <button onClick={() => setGuestNames([...guestNames, ''])} className="text-sm text-purple-600 hover:underline">+ Add another guest</button>
              <button
                onClick={handleCreate}
                disabled={!hostName.trim()}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold disabled:opacity-50 hover:opacity-90 transition mt-2"
              >
                Create Group Session
              </button>
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-3">
              <button onClick={() => setMode('choose')} className="text-sm text-purple-600 hover:underline">← Back</button>
              <input
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                placeholder="Group ID (from host)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
              <input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your name *"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleJoin}
                disabled={!joinId.trim() || !guestName.trim()}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold disabled:opacity-50 hover:opacity-90 transition"
              >
                Join Group
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
