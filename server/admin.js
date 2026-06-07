/**
 * Admin API — menu items, employees, devices
 * Protected by ADMIN_PASSWORD (or ADMIN_API_KEY) env var.
 */

const { v4: uuidv4 } = require('uuid');

const EMPLOYEE_ROLES = ['ADMIN', 'MANAGER', 'STAFF', 'KITCHEN'];
const DEVICE_TYPES = ['KDS', 'VENDOR_DISPLAY', 'QR_STATION', 'CENTRAL_BOARD'];

function getAdminSecret() {
  return process.env.ADMIN_PASSWORD || process.env.ADMIN_API_KEY || '';
}

function requireAdmin(req, res, next) {
  const secret = getAdminSecret();
  if (!secret) {
    return res.status(503).json({
      error: 'Admin panel is not configured. Set ADMIN_PASSWORD on the server.'
    });
  }
  const key =
    req.headers['x-admin-key'] ||
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!key || key !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function menuItemToMemory(item) {
  return {
    id: item.id,
    vendorId: item.vendorId,
    name: item.name,
    description: item.description || '',
    price: item.price,
    category: item.category,
    region: item.region || null,
    allergens: item.allergens || [],
    dietary: item.dietary || [],
    isVegan: item.isVegan ?? item.dietary?.includes('vegan') ?? false,
    available: item.available !== false,
    imageUrl: item.imageUrl || null
  };
}

async function syncVendorMenuToMemory(prisma, database, vendorId) {
  if (!prisma || !vendorId) return;
  try {
    const items = await prisma.menuItem.findMany({ where: { vendorId } });
    database.menus.set(
      vendorId,
      items.map(menuItemToMemory)
    );
  } catch (e) {
    console.error('syncVendorMenuToMemory:', e.message || e);
  }
}

function deviceLaunchUrl(type, vendorId, publicUrl, deviceId) {
  const base = (publicUrl || '').replace(/\/$/, '');
  const deviceParam = deviceId ? `&device=${encodeURIComponent(deviceId)}` : '';
  switch (type) {
    case 'KDS':
      return vendorId
        ? `${base}/?view=kds&vendor=${encodeURIComponent(vendorId)}${deviceParam}`
        : `${base}/?view=kds${deviceId ? `?device=${encodeURIComponent(deviceId)}` : ''}`;
    case 'VENDOR_DISPLAY':
      return vendorId
        ? `${base}/?view=vendor&vendor=${encodeURIComponent(vendorId)}${deviceParam}`
        : `${base}/?view=vendor${deviceId ? `?device=${encodeURIComponent(deviceId)}` : ''}`;
    case 'QR_STATION':
      return `${base}/?view=qr${deviceId ? `&device=${encodeURIComponent(deviceId)}` : ''}`;
    case 'CENTRAL_BOARD':
      return `${base}/?view=central${deviceId ? `&device=${encodeURIComponent(deviceId)}` : ''}`;
    default:
      return base;
  }
}

async function withDatabase(getPrisma, dbWork, memoryWork) {
  const client = typeof getPrisma === 'function' ? getPrisma() : null;
  if (client) {
    try {
      return await dbWork(client);
    } catch (e) {
      console.error('admin db fallback:', e.message || e);
    }
  }
  return memoryWork();
}

async function tryDatabase(getPrisma, dbWork) {
  const client = typeof getPrisma === 'function' ? getPrisma() : null;
  if (!client) return null;
  try {
    return await dbWork(client);
  } catch (e) {
    console.error('admin db write fallback:', e.message || e);
    return null;
  }
}

function memoryMenuItems(database, vendorId) {
  const items = [];
  database.menus.forEach((menu, vid) => {
    if (vendorId && vid !== vendorId) return;
    menu.forEach((item) => {
      const vendor = database.vendors.get(vid);
      items.push({
        ...item,
        vendor: vendor ? { id: vendor.id, name: vendor.name } : null
      });
    });
  });
  return items;
}

function createAdminRoutes(app, { getPrisma, database }) {
  if (!database.employees) database.employees = new Map();
  if (!database.devices) database.devices = new Map();

  const publicUrl = () =>
    process.env.PUBLIC_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : 'http://localhost:3000');

  app.post('/api/admin/login', (req, res) => {
    const secret = getAdminSecret();
    if (!secret) {
      return res.status(503).json({ error: 'Admin not configured on server' });
    }
    const { password } = req.body || {};
    if (password !== secret) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    res.json({ ok: true, token: secret });
  });

  app.get('/api/admin/status', requireAdmin, (req, res) => {
    res.json({
      ok: true,
      database: Boolean(typeof getPrisma === 'function' ? getPrisma() : null),
      publicUrl: publicUrl()
    });
  });

  // ─── Vendors (for dropdowns) ───────────────────────────────────────────────
  app.get('/api/admin/vendors', requireAdmin, async (req, res) => {
    try {
      const vendors = await withDatabase(
        getPrisma,
        (client) => client.vendor.findMany({ orderBy: { name: 'asc' } }),
        () => Array.from(database.vendors.values())
      );
      res.json(vendors);
    } catch (e) {
      console.error('admin vendors:', e);
      res.json(Array.from(database.vendors.values()));
    }
  });

  // ─── Menu items ────────────────────────────────────────────────────────────
  app.get('/api/admin/menu-items', requireAdmin, async (req, res) => {
    const { vendorId } = req.query;
    try {
      const items = await withDatabase(
        getPrisma,
        (client) => {
          const where = vendorId ? { vendorId } : {};
          return client.menuItem.findMany({
            where,
            include: { vendor: { select: { id: true, name: true } } },
            orderBy: [{ vendor: { name: 'asc' } }, { category: 'asc' }, { name: 'asc' }]
          });
        },
        () => memoryMenuItems(database, vendorId)
      );
      res.json(items);
    } catch (e) {
      console.error('admin menu list:', e);
      res.json(memoryMenuItems(database, vendorId));
    }
  });

  app.post('/api/admin/menu-items', requireAdmin, async (req, res) => {
    const {
      vendorId,
      name,
      price,
      category,
      description,
      region,
      allergens,
      dietary,
      isVegan,
      available
    } = req.body || {};

    if (!vendorId || !name || price == null || !category) {
      return res.status(400).json({ error: 'vendorId, name, price, and category are required' });
    }

    const data = {
      vendorId,
      name: String(name).trim(),
      price: Number(price),
      category: String(category).trim(),
      description: description ? String(description) : null,
      region: region ? String(region) : null,
      allergens: Array.isArray(allergens) ? allergens : [],
      dietary: Array.isArray(dietary) ? dietary : [],
      isVegan: Boolean(isVegan),
      available: available !== false
    };

    try {
      const item = await tryDatabase(getPrisma, (client) =>
        client.menuItem.create({
          data,
          include: { vendor: { select: { id: true, name: true } } }
        })
      );
      if (item) {
        await syncVendorMenuToMemory(getPrisma(), database, vendorId);
        return res.status(201).json(item);
      }

      const id = `item-${uuidv4().slice(0, 8)}`;
      const memItem = menuItemToMemory({ id, ...data });
      const menu = database.menus.get(vendorId) || [];
      menu.push(memItem);
      database.menus.set(vendorId, menu);
      const vendor = database.vendors.get(vendorId);
      res.status(201).json({ ...memItem, vendor: vendor ? { id: vendor.id, name: vendor.name } : null });
    } catch (e) {
      console.error('admin menu create:', e);
      res.status(500).json({ error: e.message || 'Failed to create menu item' });
    }
  });

  app.patch('/api/admin/menu-items/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const allowed = [
      'name', 'price', 'category', 'description', 'region',
      'allergens', 'dietary', 'isVegan', 'available', 'vendorId'
    ];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (updates.price != null) updates.price = Number(updates.price);

    try {
      const item = await tryDatabase(getPrisma, (client) =>
        client.menuItem.update({
          where: { id },
          data: updates,
          include: { vendor: { select: { id: true, name: true } } }
        })
      );
      if (item) {
        await syncVendorMenuToMemory(getPrisma(), database, item.vendorId);
        return res.json(item);
      }

      let found = null;
      let vendorId = null;
      database.menus.forEach((menu, vid) => {
        const idx = menu.findIndex((i) => i.id === id);
        if (idx >= 0) {
          vendorId = vid;
          menu[idx] = { ...menu[idx], ...updates };
          found = menu[idx];
        }
      });
      if (!found) return res.status(404).json({ error: 'Menu item not found' });
      const vendor = database.vendors.get(vendorId);
      res.json({ ...found, vendor: vendor ? { id: vendor.id, name: vendor.name } : null });
    } catch (e) {
      if (e?.code === 'P2025') return res.status(404).json({ error: 'Menu item not found' });
      console.error('admin menu update:', e);
      res.status(500).json({ error: e.message || 'Failed to update menu item' });
    }
  });

  app.delete('/api/admin/menu-items/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const existing = await tryDatabase(getPrisma, (client) =>
        client.menuItem.findUnique({ where: { id } })
      );
      if (existing) {
        await tryDatabase(getPrisma, (client) => client.menuItem.delete({ where: { id } }));
        await syncVendorMenuToMemory(getPrisma(), database, existing.vendorId);
        return res.json({ ok: true });
      }

      let deleted = false;
      database.menus.forEach((menu, vid) => {
        const idx = menu.findIndex((i) => i.id === id);
        if (idx >= 0) {
          menu.splice(idx, 1);
          deleted = true;
        }
      });
      if (!deleted) return res.status(404).json({ error: 'Menu item not found' });
      res.json({ ok: true });
    } catch (e) {
      console.error('admin menu delete:', e);
      res.status(500).json({ error: 'Failed to delete menu item' });
    }
  });

  // ─── Employees ─────────────────────────────────────────────────────────────
  app.get('/api/admin/employees', requireAdmin, async (req, res) => {
    try {
      const employees = await withDatabase(
        getPrisma,
        (client) =>
          client.employee.findMany({
            include: { vendor: { select: { id: true, name: true } } },
            orderBy: { name: 'asc' }
          }).then((rows) => rows.map((e) => ({ ...e, pin: e.pin ? '****' : null }))),
        () =>
          Array.from(database.employees.values()).map((e) => ({
            ...e,
            pin: e.pin ? '****' : null
          }))
      );
      res.json(employees);
    } catch (e) {
      console.error('admin employees list:', e);
      res.json(
        Array.from(database.employees.values()).map((e) => ({
          ...e,
          pin: e.pin ? '****' : null
        }))
      );
    }
  });

  app.post('/api/admin/employees', requireAdmin, async (req, res) => {
    const { name, email, phone, role, vendorId, pin, active } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });
    const roleUp = String(role || 'STAFF').toUpperCase();
    if (!EMPLOYEE_ROLES.includes(roleUp)) {
      return res.status(400).json({ error: `role must be one of: ${EMPLOYEE_ROLES.join(', ')}` });
    }

    const data = {
      name: String(name).trim(),
      email: email ? String(email).trim() : null,
      phone: phone ? String(phone).trim() : null,
      role: roleUp,
      vendorId: vendorId || null,
      pin: pin ? String(pin) : null,
      active: active !== false
    };

    try {
      const employee = await tryDatabase(getPrisma, (client) =>
        client.employee.create({
          data,
          include: { vendor: { select: { id: true, name: true } } }
        })
      );
      if (employee) {
        return res.status(201).json({ ...employee, pin: employee.pin ? '****' : null });
      }

      const id = uuidv4();
      const memEmployee = { id, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      database.employees.set(id, memEmployee);
      const vendor = vendorId ? database.vendors.get(vendorId) : null;
      res.status(201).json({
        ...memEmployee,
        pin: memEmployee.pin ? '****' : null,
        vendor: vendor ? { id: vendor.id, name: vendor.name } : null
      });
    } catch (e) {
      console.error('admin employee create:', e);
      res.status(500).json({ error: e.message || 'Failed to create employee' });
    }
  });

  app.patch('/api/admin/employees/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const updates = {};
    for (const key of ['name', 'email', 'phone', 'vendorId', 'active']) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (body.role !== undefined) {
      const roleUp = String(body.role).toUpperCase();
      if (!EMPLOYEE_ROLES.includes(roleUp)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      updates.role = roleUp;
    }
    if (body.pin !== undefined && body.pin !== '' && body.pin !== '****') {
      updates.pin = String(body.pin);
    }

    try {
      const employee = await tryDatabase(getPrisma, (client) =>
        client.employee.update({
          where: { id },
          data: updates,
          include: { vendor: { select: { id: true, name: true } } }
        })
      );
      if (employee) {
        return res.json({ ...employee, pin: employee.pin ? '****' : null });
      }

      const existing = database.employees.get(id);
      if (!existing) return res.status(404).json({ error: 'Employee not found' });
      const memEmployee = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      database.employees.set(id, memEmployee);
      const vendor = memEmployee.vendorId ? database.vendors.get(memEmployee.vendorId) : null;
      res.json({
        ...memEmployee,
        pin: memEmployee.pin ? '****' : null,
        vendor: vendor ? { id: vendor.id, name: vendor.name } : null
      });
    } catch (e) {
      if (e?.code === 'P2025') return res.status(404).json({ error: 'Employee not found' });
      console.error('admin employee update:', e);
      res.status(500).json({ error: e.message || 'Failed to update employee' });
    }
  });

  app.delete('/api/admin/employees/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const deleted = await tryDatabase(getPrisma, (client) =>
        client.employee.delete({ where: { id } }).then(() => true)
      );
      if (deleted) return res.json({ ok: true });

      if (!database.employees.has(id)) return res.status(404).json({ error: 'Employee not found' });
      database.employees.delete(id);
      res.json({ ok: true });
    } catch (e) {
      if (e?.code === 'P2025') return res.status(404).json({ error: 'Employee not found' });
      res.status(500).json({ error: 'Failed to delete employee' });
    }
  });

  // ─── Devices ───────────────────────────────────────────────────────────────
  app.get('/api/admin/devices', requireAdmin, async (req, res) => {
    try {
      const devices = await withDatabase(
        getPrisma,
        (client) =>
          client.device.findMany({
            include: { vendor: { select: { id: true, name: true } } },
            orderBy: { name: 'asc' }
          }).then((rows) =>
            rows.map((d) => ({
              ...d,
              launchUrl: deviceLaunchUrl(d.type, d.vendorId, publicUrl(), d.id)
            }))
          ),
        () =>
          Array.from(database.devices.values()).map((d) => ({
            ...d,
            launchUrl: deviceLaunchUrl(d.type, d.vendorId, publicUrl(), d.id)
          }))
      );
      res.json(devices);
    } catch (e) {
      console.error('admin devices list:', e);
      res.json(
        Array.from(database.devices.values()).map((d) => ({
          ...d,
          launchUrl: deviceLaunchUrl(d.type, d.vendorId, publicUrl(), d.id)
        }))
      );
    }
  });

  app.post('/api/admin/devices', requireAdmin, async (req, res) => {
    const { name, type, vendorId, location, config, active } = req.body || {};
    if (!name || !type) return res.status(400).json({ error: 'name and type are required' });
    const typeUp = String(type).toUpperCase();
    if (!DEVICE_TYPES.includes(typeUp)) {
      return res.status(400).json({ error: `type must be one of: ${DEVICE_TYPES.join(', ')}` });
    }

    const data = {
      name: String(name).trim(),
      type: typeUp,
      vendorId: vendorId || null,
      location: location ? String(location) : null,
      config: config && typeof config === 'object' ? config : {},
      active: active !== false
    };

    try {
      const device = await tryDatabase(getPrisma, (client) =>
        client.device.create({
          data,
          include: { vendor: { select: { id: true, name: true } } }
        })
      );
      if (device) {
        return res.status(201).json({
          ...device,
          launchUrl: deviceLaunchUrl(device.type, device.vendorId, publicUrl(), device.id)
        });
      }

      const id = uuidv4();
      const memDevice = {
        id,
        ...data,
        lastSeenAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      database.devices.set(id, memDevice);
      const vendor = vendorId ? database.vendors.get(vendorId) : null;
      res.status(201).json({
        ...memDevice,
        vendor: vendor ? { id: vendor.id, name: vendor.name } : null,
        launchUrl: deviceLaunchUrl(memDevice.type, memDevice.vendorId, publicUrl(), memDevice.id)
      });
    } catch (e) {
      console.error('admin device create:', e);
      res.status(500).json({ error: e.message || 'Failed to create device' });
    }
  });

  app.patch('/api/admin/devices/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const updates = {};
    for (const key of ['name', 'location', 'vendorId', 'active', 'config']) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (body.type !== undefined) {
      const typeUp = String(body.type).toUpperCase();
      if (!DEVICE_TYPES.includes(typeUp)) return res.status(400).json({ error: 'Invalid type' });
      updates.type = typeUp;
    }

    try {
      const device = await tryDatabase(getPrisma, (client) =>
        client.device.update({
          where: { id },
          data: updates,
          include: { vendor: { select: { id: true, name: true } } }
        })
      );
      if (device) {
        return res.json({
          ...device,
          launchUrl: deviceLaunchUrl(device.type, device.vendorId, publicUrl(), device.id)
        });
      }

      const existing = database.devices.get(id);
      if (!existing) return res.status(404).json({ error: 'Device not found' });
      const memDevice = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      database.devices.set(id, memDevice);
      const vendor = memDevice.vendorId ? database.vendors.get(memDevice.vendorId) : null;
      res.json({
        ...memDevice,
        vendor: vendor ? { id: vendor.id, name: vendor.name } : null,
        launchUrl: deviceLaunchUrl(memDevice.type, memDevice.vendorId, publicUrl(), memDevice.id)
      });
    } catch (e) {
      if (e?.code === 'P2025') return res.status(404).json({ error: 'Device not found' });
      res.status(500).json({ error: e.message || 'Failed to update device' });
    }
  });

  app.delete('/api/admin/devices/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const deleted = await tryDatabase(getPrisma, (client) =>
        client.device.delete({ where: { id } }).then(() => true)
      );
      if (deleted) return res.json({ ok: true });

      if (!database.devices.has(id)) return res.status(404).json({ error: 'Device not found' });
      database.devices.delete(id);
      res.json({ ok: true });
    } catch (e) {
      if (e?.code === 'P2025') return res.status(404).json({ error: 'Device not found' });
      res.status(500).json({ error: 'Failed to delete device' });
    }
  });

  // Device heartbeat (optional — tablets can ping when online)
  app.post('/api/devices/:id/heartbeat', async (req, res) => {
    const { id } = req.params;
    try {
      const client = typeof getPrisma === 'function' ? getPrisma() : null;
      if (client) {
        const device = await client.device.update({
          where: { id },
          data: { lastSeenAt: new Date() }
        }).catch(() => null);
        if (device) return res.json({ ok: true });
      }
      const mem = database.devices.get(id);
      if (mem) {
        mem.lastSeenAt = new Date().toISOString();
        database.devices.set(id, mem);
        return res.json({ ok: true });
      }
      res.status(404).json({ error: 'Device not found' });
    } catch (e) {
      res.status(500).json({ error: 'Heartbeat failed' });
    }
  });

  app.get('/api/devices/:id/config', async (req, res) => {
    const { id } = req.params;
    try {
      let device = null;
      const client = typeof getPrisma === 'function' ? getPrisma() : null;
      if (client) {
        device = await client.device.findUnique({
          where: { id },
          include: { vendor: { select: { id: true, name: true } } }
        }).catch(() => null);
      }
      if (!device) {
        device = database.devices.get(id) || null;
      }
      if (!device || !device.active) {
        return res.status(404).json({ error: 'Device not found or inactive' });
      }
      res.json({
        id: device.id,
        name: device.name,
        type: device.type,
        vendorId: device.vendorId,
        vendorName: device.vendor?.name,
        config: device.config || {},
        launchUrl: deviceLaunchUrl(device.type, device.vendorId, publicUrl(), device.id)
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to load device config' });
    }
  });

  console.log('🔐 Admin API mounted at /api/admin/*');
}

module.exports = { createAdminRoutes, requireAdmin };
