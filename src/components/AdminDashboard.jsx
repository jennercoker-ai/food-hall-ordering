import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
        <p className="text-slate-400 text-sm mb-6">Sign in to manage vendors, menus, staff, and devices</p>
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

function groupMenuByCategory(items) {
  const groups = {};
  items.forEach((item) => {
    const cat = item.category?.trim() || 'Uncategorised';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, rows]) => ({
      category,
      rows: rows.sort((a, b) => a.name.localeCompare(b.name))
    }));
}

function VendorSidebar({ vendors, menuItems, selectedId, onSelect }) {
  const countFor = (vendorId) => menuItems.filter((m) => m.vendorId === vendorId).length;

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Vendors</p>
      <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
        {vendors.map((v) => {
          const active = v.id === selectedId;
          const count = countFor(v.id);
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v.id)}
              className={`text-left px-3 py-3 rounded-xl border transition-all min-w-[180px] lg:min-w-0 lg:w-full ${
                active
                  ? 'bg-purple-600/20 border-purple-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-750'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm truncate">{v.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${active ? 'bg-purple-500/40' : 'bg-slate-700'}`}>
                  {count}
                </span>
              </div>
              {v.collectionPoint && (
                <p className="text-xs text-slate-500 mt-1 truncate">{v.collectionPoint}</p>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function MenuCategoryBlock({ category, rows, onEdit, onDelete }) {
  return (
    <section className="rounded-xl border border-slate-700 overflow-hidden">
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{category}</h3>
          <p className="text-xs text-slate-400">{rows.length} item{rows.length !== 1 ? 's' : ''}</p>
        </div>
        <span className="text-xs text-slate-500">from £{Math.min(...rows.map((r) => Number(r.price))).toFixed(2)}</span>
      </div>
      <div className="divide-y divide-slate-700/80">
        {rows.map((row) => (
          <div key={row.id} className="px-4 py-3 flex flex-wrap items-center gap-3 hover:bg-slate-800/40">
            <div className="flex-1 min-w-[140px]">
              <p className="font-medium text-white">{row.name}</p>
              {row.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{row.description}</p>
              )}
              {(row.dietary?.length > 0 || row.isVegan) && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {row.isVegan && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/50 text-green-300">vegan</span>
                  )}
                  {(row.dietary || []).map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-purple-300">£{Number(row.price).toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-0.5">{row.available !== false ? 'Available' : 'Hidden'}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onEdit(row)}
                className="text-xs px-3 py-1.5 rounded-lg bg-purple-600/30 text-purple-300 hover:bg-purple-600/50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(row.id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-900/30 text-red-300 hover:bg-red-900/50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(Boolean(getAdminToken()));
  const [section, setSection] = useState('vendors');
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [vendorTab, setVendorTab] = useState('menu');
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
      const results = await Promise.allSettled([
        adminFetch('/api/admin/vendors'),
        adminFetch('/api/admin/menu-items'),
        adminFetch('/api/admin/employees'),
        adminFetch('/api/admin/devices')
      ]);
      const pick = (i) => (results[i].status === 'fulfilled' ? results[i].value : []);
      const v = pick(0);
      setVendors(v);
      setMenuItems(pick(1));
      setEmployees(pick(2));
      setDevices(pick(3));
      const failed = results.find((r) => r.status === 'rejected');
      if (failed) setError(failed.reason?.message || 'Some data failed to load');
      if (failed?.reason?.message?.includes('Session expired')) setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadAll();
  }, [authed, loadAll]);

  useEffect(() => {
    if (!vendors.length) return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('vendor');
    if (fromUrl && vendors.some((v) => v.id === fromUrl)) {
      setSelectedVendorId(fromUrl);
      return;
    }
    setSelectedVendorId((prev) => prev && vendors.some((v) => v.id === prev) ? prev : vendors[0].id);
  }, [vendors]);

  const selectVendor = (id) => {
    setSelectedVendorId(id);
    setVendorTab('menu');
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'admin');
    url.searchParams.set('vendor', id);
    window.history.replaceState({}, '', url);
  };

  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);
  const vendorMenu = useMemo(
    () => menuItems.filter((m) => m.vendorId === selectedVendorId),
    [menuItems, selectedVendorId]
  );
  const menuByCategory = useMemo(() => groupMenuByCategory(vendorMenu), [vendorMenu]);
  const vendorEmployees = useMemo(
    () => employees.filter((e) => e.vendorId === selectedVendorId),
    [employees, selectedVendorId]
  );
  const vendorDevices = useMemo(
    () => devices.filter((d) => d.vendorId === selectedVendorId),
    [devices, selectedVendorId]
  );

  const logout = () => {
    setAdminToken('');
    setAuthed(false);
  };

  const blankMenuForm = (vendorId, category = '') => ({
    vendorId,
    name: '',
    price: '',
    category,
    description: '',
    available: true,
    allergens: '',
    dietary: '',
    isVegan: false
  });

  const openNewMenu = (category = '') => {
    setEditing({ type: 'menu', id: null });
    setForm(blankMenuForm(selectedVendorId, category));
  };

  const openNew = (type) => {
    setEditing({ type, id: null });
    if (type === 'menu') {
      setForm(blankMenuForm(selectedVendorId));
    } else if (type === 'employee') {
      setForm({ name: '', email: '', phone: '', role: 'STAFF', vendorId: selectedVendorId || '', pin: '', active: true });
    } else {
      setForm({
        name: '',
        type: 'KDS',
        vendorId: selectedVendorId || '',
        location: '',
        active: true,
        refreshIntervalSec: 10,
        soundEnabled: true
      });
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

  const mainSections = [
    { id: 'vendors', label: 'Vendors & menus' },
    { id: 'employees', label: 'All staff', count: employees.length },
    { id: 'devices', label: 'All devices', count: devices.length }
  ];

  const vendorSubTabs = [
    { id: 'menu', label: 'Menu', count: vendorMenu.length },
    { id: 'staff', label: 'Staff', count: vendorEmployees.length },
    { id: 'devices', label: 'Devices', count: vendorDevices.length }
  ];

  const existingCategories = [...new Set(vendorMenu.map((m) => m.category).filter(Boolean))].sort();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <a href={`${BASE}/?view=staff`} className="text-xs text-slate-400 hover:text-white">← Staff home</a>
            <h1 className="text-xl sm:text-2xl font-bold">Admin</h1>
            <p className="text-xs text-slate-500 mt-0.5">Set up each vendor&apos;s menu, prices, and categories</p>
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
        <div className="max-w-7xl mx-auto flex gap-2 mt-4 overflow-x-auto">
          {mainSections.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSection(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                section === t.id ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {t.label}{t.count != null ? ` (${t.count})` : ''}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-200 text-sm">{error}</div>
        )}
        {loading && <p className="text-slate-400 text-sm mb-4">Loading…</p>}

        {section === 'vendors' && (
          <div className="flex flex-col lg:flex-row gap-6">
            <VendorSidebar
              vendors={vendors}
              menuItems={menuItems}
              selectedId={selectedVendorId}
              onSelect={selectVendor}
            />

            <div className="flex-1 min-w-0">
              {!selectedVendor ? (
                <p className="text-slate-400">Select a vendor to manage their menu.</p>
              ) : (
                <>
                  <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-slate-800 border border-slate-700">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedVendor.name}</h2>
                        {selectedVendor.description && (
                          <p className="text-slate-400 text-sm mt-1 max-w-xl">{selectedVendor.description}</p>
                        )}
                        {selectedVendor.collectionPoint && (
                          <p className="text-xs text-purple-300 mt-2">Collection: {selectedVendor.collectionPoint}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-center">
                        <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 min-w-[72px]">
                          <p className="text-lg font-bold text-white">{vendorMenu.length}</p>
                          <p className="text-[10px] text-slate-500 uppercase">Items</p>
                        </div>
                        <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 min-w-[72px]">
                          <p className="text-lg font-bold text-white">{menuByCategory.length}</p>
                          <p className="text-[10px] text-slate-500 uppercase">Categories</p>
                        </div>
                        <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 min-w-[72px]">
                          <p className="text-lg font-bold text-purple-300">
                            {vendorMenu.length
                              ? `£${Math.min(...vendorMenu.map((m) => Number(m.price))).toFixed(0)}–${Math.max(...vendorMenu.map((m) => Number(m.price))).toFixed(0)}`
                              : '—'}
                          </p>
                          <p className="text-[10px] text-slate-500 uppercase">Price range</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 overflow-x-auto">
                      {vendorSubTabs.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setVendorTab(t.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                            vendorTab === t.id ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {t.label} ({t.count})
                        </button>
                      ))}
                    </div>
                  </div>

                  {vendorTab === 'menu' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openNewMenu()}
                          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-semibold"
                        >
                          + Add menu item
                        </button>
                        {existingCategories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => openNewMenu(cat)}
                            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-300"
                          >
                            + in {cat}
                          </button>
                        ))}
                      </div>

                      {vendorMenu.length === 0 ? (
                        <div className="text-center py-12 rounded-xl border border-dashed border-slate-600">
                          <p className="text-slate-400 mb-3">No menu items yet for {selectedVendor.name}</p>
                          <button
                            type="button"
                            onClick={() => openNewMenu()}
                            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-semibold"
                          >
                            Add first item
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {menuByCategory.map(({ category, rows }) => (
                            <MenuCategoryBlock
                              key={category}
                              category={category}
                              rows={rows}
                              onEdit={(row) => openEdit('menu', row)}
                              onDelete={(id) => remove('menu', id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {vendorTab === 'staff' && (
                    <div>
                      <button
                        type="button"
                        onClick={() => openNew('employee')}
                        className="mb-4 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-semibold"
                      >
                        + Add staff member
                      </button>
                      {vendorEmployees.length === 0 ? (
                        <p className="text-slate-400 text-sm">No staff assigned to this vendor.</p>
                      ) : (
                        <div className="rounded-xl border border-slate-700 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-800 text-slate-400">
                              <tr>
                                <th className="text-left p-3">Name</th>
                                <th className="text-left p-3">Role</th>
                                <th className="text-left p-3">Contact</th>
                                <th className="p-3"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {vendorEmployees.map((row) => (
                                <tr key={row.id} className="border-t border-slate-700">
                                  <td className="p-3 font-medium">{row.name}</td>
                                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-700 text-xs">{row.role}</span></td>
                                  <td className="p-3 text-slate-400">{row.email || row.phone || '—'}</td>
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
                    </div>
                  )}

                  {vendorTab === 'devices' && (
                    <div>
                      <button
                        type="button"
                        onClick={() => openNew('device')}
                        className="mb-4 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-semibold"
                      >
                        + Register device
                      </button>
                      {vendorDevices.length === 0 ? (
                        <p className="text-slate-400 text-sm">No devices registered for this vendor.</p>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {vendorDevices.map((row) => (
                            <div key={row.id} className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                              <h3 className="font-bold">{row.name}</h3>
                              <p className="text-xs text-purple-300">{row.type}</p>
                              <p className="text-sm text-slate-400 mt-1">{row.location || 'No location'}</p>
                              {row.launchUrl && (
                                <a href={row.launchUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline break-all block mt-2">
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
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {section === 'employees' && (
          <div>
            <button type="button" onClick={() => openNew('employee')} className="mb-4 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-semibold">
              + Add staff member
            </button>
            <div className="overflow-x-auto rounded-xl border border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-slate-400">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">Vendor</th>
                    <th className="text-left p-3">Contact</th>
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
                      <td className="p-3 text-right whitespace-nowrap">
                        <button type="button" onClick={() => openEdit('employee', row)} className="text-purple-400 mr-3">Edit</button>
                        <button type="button" onClick={() => remove('employee', row.id)} className="text-red-400">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {section === 'devices' && (
          <div>
            <button type="button" onClick={() => openNew('device')} className="mb-4 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-semibold">
              + Register device
            </button>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {devices.map((row) => (
                <div key={row.id} className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                  <h3 className="font-bold">{row.name}</h3>
                  <p className="text-xs text-purple-300">{row.type}</p>
                  <p className="text-sm text-slate-400 mt-1">{row.vendor?.name || 'All vendors'} · {row.location || 'No location'}</p>
                  {row.launchUrl && (
                    <a href={row.launchUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline break-all block mt-2">
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
          </div>
        )}
      </main>

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 border border-slate-600">
            <h2 className="text-lg font-bold mb-1">
              {editing.id ? 'Edit' : 'Add'}{' '}
              {editing.type === 'menu' ? 'menu item' : editing.type === 'employee' ? 'staff member' : 'device'}
            </h2>
            {editing.type === 'menu' && selectedVendor && (
              <p className="text-sm text-slate-400 mb-4">{selectedVendor.name}</p>
            )}

            {editing.type === 'menu' && (
              <>
                <Field label="Item name">
                  <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Price (£)">
                    <input type="number" step="0.01" min="0" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </Field>
                  <Field label="Category">
                    <input
                      className={inputCls}
                      list="menu-categories"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="e.g. Mains, Drinks"
                    />
                    <datalist id="menu-categories">
                      {existingCategories.map((c) => <option key={c} value={c} />)}
                    </datalist>
                  </Field>
                </div>
                <Field label="Description">
                  <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </Field>
                <Field label="Allergens (comma-separated)">
                  <input className={inputCls} value={form.allergens} onChange={(e) => setForm({ ...form, allergens: e.target.value })} />
                </Field>
                <Field label="Dietary tags">
                  <input className={inputCls} value={form.dietary} onChange={(e) => setForm({ ...form, dietary: e.target.value })} placeholder="vegan, vegetarian" />
                </Field>
                <label className="flex items-center gap-2 mb-3 text-sm">
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
                <Field label="Assigned vendor">
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
                <Field label="Vendor">
                  <select className={inputCls} value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })}>
                    <option value="">— Not vendor-specific —</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </Field>
                <Field label="Location"><input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Station 3, back kitchen" /></Field>
                <Field label="Refresh interval (seconds)"><input type="number" className={inputCls} value={form.refreshIntervalSec} onChange={(e) => setForm({ ...form, refreshIntervalSec: e.target.value })} /></Field>
                <label className="flex items-center gap-2 mb-3 text-sm">
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
