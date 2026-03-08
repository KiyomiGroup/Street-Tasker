// js/config.js — Supabase client + all DB/Auth/Realtime helpers

// ── REPLACE WITH YOUR SUPABASE CREDENTIALS ────────────────
const SUPABASE_URL  = 'https://tulvaarvlfelwdvwvacu.supabase.co';
const SUPABASE_ANON = 'sb_publishable_hQDbJ5mocMSKIfQfkB058Q_IOj-bhg3';
// ──────────────────────────────────────────────────────────

const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ── AUTH ─────────────────────────────────────────────────
const Auth = {
  async signUp({ email, password, name, location, role }) {
    const { data, error } = await _sb.auth.signUp({
      email, password,
      options: { data: { name, location, role } }
    });
    if (error) throw error;
    return data;
  },
  async signIn({ email, password }) {
    const { data, error } = await _sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signOut() {
    await _sb.auth.signOut();
    window.location.href = 'index.html';
  },
  async getUser() {
    const { data: { user } } = await _sb.auth.getUser();
    return user;
  },
  async getSession() {
    const { data: { session } } = await _sb.auth.getSession();
    return session;
  },
  onAuthChange(cb) {
    return _sb.auth.onAuthStateChange(cb);
  },
  async requireAuth() {
    const s = await this.getSession();
    if (!s) { window.location.href = 'login.html'; return null; }
    return s.user;
  },
  async redirectIfAuth() {
    const s = await this.getSession();
    if (s) window.location.href = 'dashboard.html';
  }
};

// ── DB ────────────────────────────────────────────────────
const DB = {
  // Profiles
  async getProfile(id) {
    const { data, error } = await _sb.from('profiles').select('*').eq('id', id).single();
    if (error) throw error; return data;
  },
  async updateProfile(id, updates) {
    const { data, error } = await _sb.from('profiles').update(updates).eq('id', id).select().single();
    if (error) throw error; return data;
  },
  async getTaskers({ search, limit = 24 } = {}) {
    let q = _sb.from('profiles').select('*').eq('role', 'tasker').eq('banned', false).order('rating', { ascending: false });
    if (search) q = q.ilike('name', `%${search}%`);
    q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error; return data;
  },

  // Tasks
  async createTask(task) {
    const { data, error } = await _sb.from('tasks').insert(task).select().single();
    if (error) throw error; return data;
  },
  async getTasks({ category, status, search, limit = 30, offset = 0 } = {}) {
    let q = _sb.from('tasks')
      .select('*, poster:created_by(id,name,avatar_url,rating,location)')
      .order('created_at', { ascending: false });
    if (category && category !== 'All') q = q.eq('category', category);
    if (status) q = q.eq('status', status);
    if (search) q = q.ilike('title', `%${search}%`);
    q = q.range(offset, offset + limit - 1);
    const { data, error } = await q;
    if (error) throw error; return data;
  },
  async getTask(id) {
    const { data, error } = await _sb.from('tasks')
      .select('*, poster:created_by(id,name,avatar_url,rating,jobs_completed,location,bio), assignee:assigned_to(id,name,avatar_url,rating)')
      .eq('id', id).single();
    if (error) throw error;
    await _sb.from('tasks').update({ views: (data.views || 0) + 1 }).eq('id', id);
    return data;
  },
  async getMyTasks(userId) {
    const { data, error } = await _sb.from('tasks')
      .select('*, applicants:applications(count)').eq('created_by', userId)
      .order('created_at', { ascending: false });
    if (error) throw error; return data;
  },
  async getMyAssignedTasks(userId) {
    const { data, error } = await _sb.from('tasks')
      .select('*, poster:created_by(id,name,avatar_url)').eq('assigned_to', userId)
      .order('created_at', { ascending: false });
    if (error) throw error; return data;
  },
  async updateTask(id, updates) {
    const { data, error } = await _sb.from('tasks').update(updates).eq('id', id).select().single();
    if (error) throw error; return data;
  },
  async deleteTask(id) {
    const { error } = await _sb.from('tasks').delete().eq('id', id);
    if (error) throw error;
  },

  // Applications
  async apply({ taskId, taskerId, offerPrice, message }) {
    const { data, error } = await _sb.from('applications')
      .insert({ task_id: taskId, tasker_id: taskerId, offer_price: offerPrice, message, status: 'pending' })
      .select().single();
    if (error) throw error;
    const task = await this.getTask(taskId);
    await this.notify({ userId: task.created_by, type: 'application', title: 'New application!', body: `Someone applied for "${task.title}"`, link: `task-details.html?id=${taskId}` });
    return data;
  },
  async getApplications(taskId) {
    const { data, error } = await _sb.from('applications')
      .select('*, tasker:tasker_id(id,name,avatar_url,rating,jobs_completed,bio,skills)')
      .eq('task_id', taskId).order('created_at', { ascending: false });
    if (error) throw error; return data;
  },
  async getMyApplications(taskerId) {
    const { data, error } = await _sb.from('applications')
      .select('*, task:task_id(id,title,budget,status,category,location,created_at)')
      .eq('tasker_id', taskerId).order('created_at', { ascending: false });
    if (error) throw error; return data;
  },
  async hasApplied(taskId, taskerId) {
    const { data } = await _sb.from('applications').select('id').eq('task_id', taskId).eq('tasker_id', taskerId).single();
    return !!data;
  },
  async acceptApplication(appId, taskId, taskerId) {
    await _sb.from('applications').update({ status: 'accepted' }).eq('id', appId);
    await _sb.from('applications').update({ status: 'rejected' }).eq('task_id', taskId).neq('id', appId);
    await this.updateTask(taskId, { status: 'assigned', assigned_to: taskerId });
    await this.notify({ userId: taskerId, type: 'accepted', title: 'You got hired! 🎉', body: 'Your application was accepted.', link: `task-details.html?id=${taskId}` });
  },

  // Messages
  async sendMessage({ taskId, senderId, receiverId, message }) {
    const { data, error } = await _sb.from('messages')
      .insert({ task_id: taskId, sender_id: senderId, receiver_id: receiverId, message })
      .select().single();
    if (error) throw error;
    await this.notify({ userId: receiverId, type: 'message', title: 'New message', body: message.substring(0, 60), link: `task-details.html?id=${taskId}` });
    return data;
  },
  async getMessages(taskId) {
    const { data, error } = await _sb.from('messages')
      .select('*, sender:sender_id(name,avatar_url)')
      .eq('task_id', taskId).order('created_at', { ascending: true });
    if (error) throw error; return data;
  },
  subscribeMessages(taskId, cb) {
    return _sb.channel(`chat-${taskId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `task_id=eq.${taskId}` }, cb)
      .subscribe();
  },

  // Reviews
  async submitReview({ taskId, reviewerId, revieweeId, rating, comment }) {
    const { data, error } = await _sb.from('reviews')
      .insert({ task_id: taskId, reviewer_id: reviewerId, reviewee_id: revieweeId, rating, comment })
      .select().single();
    if (error) throw error;
    await this.notify({ userId: revieweeId, type: 'review', title: 'New review!', body: `You received a ${rating}★ review.`, link: `profile.html?id=${revieweeId}` });
    return data;
  },
  async getReviews(userId) {
    const { data, error } = await _sb.from('reviews')
      .select('*, reviewer:reviewer_id(name,avatar_url)')
      .eq('reviewee_id', userId).order('created_at', { ascending: false });
    if (error) throw error; return data;
  },
  async hasReviewed(taskId, reviewerId) {
    const { data } = await _sb.from('reviews').select('id').eq('task_id', taskId).eq('reviewer_id', reviewerId).single();
    return !!data;
  },

  // Notifications
  async notify({ userId, type, title, body, link = '' }) {
    await _sb.from('notifications').insert({ user_id: userId, type, title, body, link, read: false });
  },
  async getNotifs(userId) {
    const { data, error } = await _sb.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30);
    if (error) throw error; return data;
  },
  async markNotifsRead(userId) {
    await _sb.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  },
  subscribeNotifs(userId, cb) {
    return _sb.channel(`notifs-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, cb)
      .subscribe();
  },

  // Storage
  async uploadAvatar(userId, file) {
    const ext = file.name.split('.').pop();
    const path = `${userId}.${ext}`;
    const { error } = await _sb.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = _sb.storage.from('avatars').getPublicUrl(path);
    await this.updateProfile(userId, { avatar_url: data.publicUrl });
    return data.publicUrl;
  },
  async uploadTaskPhoto(file) {
    const path = `${Date.now()}-${file.name}`;
    const { error } = await _sb.storage.from('task-photos').upload(path, file);
    if (error) throw error;
    const { data } = _sb.storage.from('task-photos').getPublicUrl(path);
    return data.publicUrl;
  },

  // Admin
  async adminUsers(limit = 50) {
    const { data, error } = await _sb.from('profiles').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error; return data;
  },
  async adminTasks(limit = 50) {
    const { data, error } = await _sb.from('tasks').select('*, poster:created_by(name)').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error; return data;
  },
  async adminBan(userId) {
    const { error } = await _sb.from('profiles').update({ banned: true }).eq('id', userId);
    if (error) throw error;
  },
  async adminUnban(userId) {
    const { error } = await _sb.from('profiles').update({ banned: false }).eq('id', userId);
    if (error) throw error;
  },
  async adminDeleteTask(id) {
    const { error } = await _sb.from('tasks').delete().eq('id', id);
    if (error) throw error;
  },
  async adminStats() {
    const [users, tasks, reviews] = await Promise.all([
      _sb.from('profiles').select('id', { count: 'exact', head: true }),
      _sb.from('tasks').select('id', { count: 'exact', head: true }),
      _sb.from('reviews').select('id', { count: 'exact', head: true })
    ]);
    return { users: users.count, tasks: tasks.count, reviews: reviews.count };
  }
};

// ── UTILS ─────────────────────────────────────────────────
const Utils = {
  fmt(n) { return '₦' + Number(n || 0).toLocaleString('en-NG'); },
  timeAgo(d) {
    const diff = (Date.now() - new Date(d)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  },
  initials(n = '') { return n.split(' ').map(w => w[0] || '').join('').substring(0, 2).toUpperCase() || '??'; },
  stars(r = 0) { const f = Math.round(r); return '★'.repeat(f) + '☆'.repeat(5 - f); },
  avatar(p, size = 'md') {
    if (p?.avatar_url) return `<img src="${p.avatar_url}" class="avatar avatar-${size}" alt="${p?.name || ''}">`;
    return `<div class="avatar avatar-${size}">${this.initials(p?.name)}</div>`;
  },
  statusBadge(s) {
    const map = { open: 'badge-open', assigned: 'badge-assigned', in_progress: 'badge-in_progress', completed: 'badge-completed', cancelled: 'badge-cancelled' };
    return `<span class="badge ${map[s] || 'badge-gray'}">${(s || '').replace('_', ' ')}</span>`;
  },
  qs(p) {
    const params = new URLSearchParams(window.location.search);
    return params.get(p);
  },
  sanitize(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
};

// ── TOAST ─────────────────────────────────────────────────
const Toast = {
  _c: null,
  _get() {
    if (!this._c) {
      this._c = document.createElement('div');
      this._c.className = 'toast-container';
      document.body.appendChild(this._c);
    }
    return this._c;
  },
  show(msg, type = 'info', ms = 4000) {
    const icons = { success: '✅', error: '❌', info: '⚡' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${icons[type] || '💬'}</span><span>${msg}</span>`;
    this._get().appendChild(t);
    setTimeout(() => { t.style.cssText = 'opacity:0;transform:translateX(20px);transition:.3s'; setTimeout(() => t.remove(), 300); }, ms);
  },
  success(m) { this.show(m, 'success'); },
  error(m)   { this.show(m, 'error'); },
  info(m)    { this.show(m, 'info'); }
};

window._sb   = _sb;
window.Auth  = Auth;
window.DB    = DB;
window.Utils = Utils;
window.Toast = Toast;
