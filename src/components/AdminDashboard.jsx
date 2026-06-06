import React, { useState, useEffect, useCallback } from 'react';
import {
  adminFetch,
  adminLogin,
  getAdminToken,
  setAdminToken
} from '../hooks/useAdminApi';

const BASE = typeof window !== 'undefined' ? window.location.origin : '';
const ROLES = ['ADMIN', 'MANAGER', 'STAFF', 'KITCHEN'];
const DEVICE_TYPES = ['KDS', 'VENDOR_DISPLAY', 'QR_STATION', 'CENTRAL_BOARD'];

function LoginScreen({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(password);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-1">Admin</h1>
        <p className="text-slate-400 text-sm mb-6">Sign in to manage menu, staff, and devices</p>
        <label className="block text-sm text-slate-300 mb-2">Admin password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white mb-4 focus:ring-2 focus:ring-purple-500"
          autoComplete="current-password"
          required
        />
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <a href={`${BASE}/?view=staff`} className="block text-center text-slate-500 text-sm mt-4 hover:text-slate-300">
          ← Staff home
        </a>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls = 'w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm';

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(Boolean(getAdminToken()));
  const [tab, setTab] = useState('menu');
  const [vendors, setVendors] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [v, m, e, d] = await Promise.all([
        adminFetch('/api/admin/vendors'),
        adminFetch('/api/admin/menu-items'),
        adminFetch('/api/admin/employees'),
        adminFetch('/api/admin/devices')
      ]);
      setVendors(v);
      setMenuItems(m);
      setEmployees(e);
      setDevices(d);
    } catch (err) {
      setError(err.message);
      if (err.message.includes('Session expired')) setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadAll();
  }, [authed, loadAll]);

  const logout = () => {
    setAdminToken('');
    setAuthed(false);
  };

  const openNew = (type) => {
    setEditing({ type, id: null });
    if (type === 'menu') {
      setForm({ vendorId: vendors[0]?.id || '', name: '', price: '', category: '', description: '', available: true, allergens: '', dietary: '', isVegan: false });
    } else if (type === 'employee') {
      setForm({ name: '', email: '', phone: '', role: 'STAFF', vendorId: '', pin: '', active: true });
    } else {
      setForm({ name: '', type: 'KDS', vendorId: '', location: '', active: true, refreshIntervalSec: 10, soundEnabled: true });
    }
  };

  const openEdit = (type, row) => {
    setEditing({ type, id: row.id });
    if (type === 'menu') {
      setForm({
        vendorId: row.vendorId,
        name: row.name,
        price: row.price,
        category: row.category,
        description: row.description || '',
        available: row.available !== false,
        allergens: (row.allergens || []).join(', '),
        dietary: (row.dietary || []).join(', '),
        isVegan: row.isVegan || false
      });
    } else if (type === 'employee') {
      setForm({
        name: row.name,
        email: row.email || '',
        phone: row.phone || '',
        role: row.role,
        vendorId: row.vendorId || '',
        pin: '',
        active: row.active !== false
      });
    } else {
      const cfg = row.config || {};
      setForm({
        name: row.name,
        type: row.type,
        vendorId: row.vendorId || '',
        location: row.location || '',
        active: row.active !== false,
        refreshIntervalSec: cfg.refreshIntervalSec ?? 10,
        soundEnabled: cfg.soundEnabled !== false
      });
    }
  };

  const save = async () => {
    setError('');
    try {
      const { type, id } = editing;
      if (type === 'menu') {
        const body = {
          vendorId: form.vendorId,
          name: form.name,
          price: parseFloat(form.price),
          category: form.category,
          description: form.description || null,
          available: form.available,
          isVegan: form.isVegan,
          allergens: form.allergens ? form.allergens.split(',').map((s) => s.trim()).filter(Boolean) : [],
          dietary: form.dietary ? form.dietary.split(',').map((s) => s.trim()).filter(Boolean) : []
        };
        if (id) await adminFetch(`/api/admin/menu-items/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
        else await adminFetch('/api/admin/menu-items', { method: 'POST', body: JSON.stringify(body) });
      } else if (type === 'employee') {
        const body = {
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          role: form.role,
          vendorId: form.vendorId || null,
          pin: form.pin || null,
          active: form.active
        };
        if (id) await adminFetch(`/api/admin/employees/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
        else await adminFetch('/api/admin/employees', { method: 'POST', body: JSON.stringify(body) });
      } else {
        const body = {
          name: form.name,
          type: form.type,
          vendorId: form.vendorId || null,
          location: form.location || null,
          active: form.active,
          config: {
            refreshIntervalSec: Number(form.refreshIntervalSec) || 10,
            soundEnabled: form.soundEnabled !== false
          }
        };
        if (id) await adminFetch(`/api/admin/devices/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
        else await adminFetch('/api/admin/devices', { method: 'POST', body: JSON.stringify(body) });
      }
      setEditing(null);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (type, id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      if (type === 'menu') await adminFetch(`/api/admin/menu-items/${id}`, { method: 'DELETE' });
      else if (type === 'employee') await adminFetch(`/api/admin/employees/${id}`, { method: 'DELETE' });
      else await adminFetch(`/api/admin/devices/${id}`, { method: 'DELETE' });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!authed) {
    return <LoginScreen onSuccess={() => setAuthed(true)} />;
  }

  const tabs = [
    { id: 'menu', label: 'Menu items', count: menuItems.length },
    { id: 'employees', label: 'Employees', count: employees.length },
    { id: 'devices', label: 'Devices', count: devices.length }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <a href={`${BASE}/?view=staff`} className="text-xs text-slate-400 hover:text-white">← Staff home</a>
            <h1 className="text-xl sm:text-2xl font-bold">Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={loadAll} disabled={loading} className="text-sm px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600">
              Refresh
            </button>
            <button type="button" onClick={logout} className="text-sm px-3 py-1.5 rounded bg-slate-700 hover:bg-red-700">
              Sign out
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto flex gap-2 mt-4 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                tab === t.id ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-200 text-sm">{error}</div>
        )}

        <div className="mb-4">
          <button
            type="button"
            onClick={() => openNew(tab === 'menu' ? 'menu' : tab === 'employees' ? 'employee' : 'device')}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-semibold"
          >
            + Add {tab === 'menu' ? 'menu item' : tab.slice(0, -1)}
          </button>
        </div>

        {loading && <p className="text-slate-400 text-sm mb-4">Loading…</p>}

        {tab === 'menu' && (
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-slate-400">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Vendor</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-right p-3">Price</th>
                  <th className="text-center p-3">Available</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map((row) => (
                  <tr key={row.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                    <td className="p-3 font-medium">{row.name}</td>
                    <td className="p-3 text-slate-400">{row.vendor?.name || row.vendorId}</td>
                    <td className="p-3">{row.category}</td>
                    <td className="p-3 text-right">£{Number(row.price).toFixed(2)}</td>
                    <td className="p-3 text-center">{row.available !== false ? '✓' : '—'}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button type="button" onClick={() => openEdit('menu', row)} className="text-purple-400 hover:text-purple-300 mr-3">Edit</button>
                      <button type="button" onClick={() => remove('menu', row.id)} className="text-red-400 hover:text-red-300">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'employees' && (
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-slate-400">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Vendor</th>
                  <th className="text-left p-3">Contact</th>
                  <th className="text-center p-3">Active</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {employees.map((row) => (
                  <tr key={row.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                    <td className="p-3 font-medium">{row.name}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-700 text-xs">{row.role}</span></td>
                    <td className="p-3 text-slate-400">{row.vendor?.name || '—'}</td>
                    <td className="p-3 text-slate-400">{row.email || row.phone || '—'}</td>
                    <td className="p-3 text-center">{row.active !== false ? '✓' : '—'}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button type="button" onClick={() => openEdit('employee', row)} className="text-purple-400 mr-3">Edit</button>
                      <button type="button" onClick={() => remove('employee', row.id)} className="text-red-400">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'devices' && (
          <div className="grid gap-4 sm:grid-cols-2">
            {devices.map((row) => (
              <div key={row.id} className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{row.name}</h3>
                    <p className="text-xs text-purple-300">{row.type}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${row.active !== false ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-400'}`}>
                    {row.active !== false ? 'Active' : 'Off'}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-1">{row.vendor?.name || 'All vendors'} · {row.location || 'No location'}</p>
                {row.launchUrl && (
                  <a href={row.launchUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline break-all">
                    Open device URL →
                  </a>
                )}
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => openEdit('device', row)} className="text-sm text-purple-400">Edit</button>
                  <button type="button" onClick={() => remove('device', row.id)} className="text-sm text-red-400">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 border border-slate-600">
            <h2 className="text-lg font-bold mb-4">
              {editing.id ? 'Edit' : 'Add'}{' '}
              {editing.type === 'menu' ? 'menu item' : editing.type === 'employee' ? 'employee' : 'device'}
            </h2>

            {editing.type === 'menu' && (
              <>
                <Field label="Vendor">
                  <select className={inputCls} value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })}>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </Field>
                <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Price (£)"><input type="number" step="0.01" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
                  <Field label="Category"><input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
                </div>
                <Field label="Description"><textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                <Field label="Allergens (comma-separated)"><input className={inputCls} value={form.allergens} onChange={(e) => setForm({ ...form, allergens: e.target.value })} /></Field>
                <Field label="Dietary tags"><input className={inputCls} value={form.dietary} onChange={(e) => setForm({ ...form, dietary: e.target.value })} placeholder="vegan, vegetarian" /></Field>
                <label className="flex items-center gap-2 mb-4 text-sm">
                  <input type="checkbox" checked={form.isVegan} onChange={(e) => setForm({ ...form, isVegan: e.target.checked })} />
                  Vegan
                </label>
                <label className="flex items-center gap-2 mb-4 text-sm">
                  <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
                  Available for ordering
                </label>
              </>
            )}

            {editing.type === 'employee' && (
              <>
                <Field label="Full name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Role">
                  <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Assigned vendor (optional)">
                  <select className={inputCls} value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })}>
                    <option value="">— None —</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </Field>
                <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Phone"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                <Field label="Device PIN (optional)"><input className={inputCls} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} placeholder={editing.id ? 'Leave blank to keep' : ''} /></Field>
                <label className="flex items-center gap-2 mb-4 text-sm">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                  Active
                </label>
              </>
            )}

            {editing.type === 'device' && (
              <>
                <Field label="Device name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kitchen iPad 1" /></Field>
                <Field label="Type">
                  <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {DEVICE_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </Field>
                <Field label="Vendor (for KDS / vendor display)">
                  <select className={inputCls} value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })}>
                    <option value="">— Not vendor-specific —</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </Field>
                <Field label="Location"><input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Station 3, back kitchen" /></Field>
                <Field label="Refresh interval (seconds)"><input type="number" className={inputCls} value={form.refreshIntervalSec} onChange={(e) => setForm({ ...form, refreshIntervalSec: e.target.value })} /></Field>
                <label className="flex items-center gap-2 mb-4 text-sm">
                  <input type="checkbox" checked={form.soundEnabled} onChange={(e) => setForm({ ...form, soundEnabled: e.target.checked })} />
                  Sound alerts enabled
                </label>
                <label className="flex items-center gap-2 mb-4 text-sm">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                  Active
                </label>
              </>
            )}

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={save} className="flex-1 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 font-semibold">Save</button>
              <button type="button" onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
