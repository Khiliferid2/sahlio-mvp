document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  document.getElementById('login-form').classList.toggle('hidden', t.dataset.tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', t.dataset.tab !== 'register');
}));

async function doLogin() {
  const phone = document.getElementById('li-phone').value.trim();
  const password = document.getElementById('li-pass').value;
  try {
    const { token, user } = await API.call('POST', '/api/auth/login', { phone, password });
    API.setSession(token, user);
    boot();
  } catch (e) { document.getElementById('li-error').textContent = e.message; }
}

async function doRegister() {
  const full_name = document.getElementById('re-name').value.trim();
  const phone = document.getElementById('re-phone').value.trim();
  const password = document.getElementById('re-pass').value;
  try {
    const { token, user } = await API.call('POST', '/api/auth/register', { full_name, phone, password, role: 'client' });
    API.setSession(token, user);
    boot();
  } catch (e) { document.getElementById('re-error').textContent = e.message; }
}

async function loadServices() {
  const services = await API.call('GET', '/api/services');
  const sel = document.getElementById('req-service');
  sel.innerHTML = services.map(s => `<option value="${s.id}">${s.name_ar} — ${s.name_fr}</option>`).join('');
}

async function submitRequest() {
  const service_id = document.getElementById('req-service').value;
  const description = document.getElementById('req-desc').value.trim();
  const zone = document.getElementById('req-zone').value;
  const [lat, lng] = ZONES[zone];
  if (!description) return document.getElementById('req-error').textContent = 'اكتب وصف الطلب';
  try {
    await API.call('POST', '/api/requests', { service_id, description, lat, lng, address_label: zone });
    document.getElementById('req-desc').value = '';
    document.getElementById('req-error').textContent = '';
    loadMyRequests();
  } catch (e) { document.getElementById('req-error').textContent = e.message; }
}

async function loadMyRequests() {
  const rows = await API.call('GET', '/api/requests/mine');
  const box = document.getElementById('my-requests');
  if (rows.length === 0) { box.innerHTML = '<p class="small">ما فماش طلبات باهي.</p>'; return; }
  box.innerHTML = rows.map(r => `
    <div class="request-item">
      <div><strong>${r.service_name}</strong> — <span class="small">${r.address_label}</span></div>
      <div class="small">${r.description}</div>
      <div class="small">الحالة: ${statusLabel(r.status)} · ${r.offer_count} عرض</div>
      <button class="ghost" style="margin-top:8px;" onclick="viewOffers('${r.id}')">شوف العروض</button>
    </div>
  `).join('');
}

function statusLabel(s) {
  return { pending: 'فـ الانتظار', matched: 'تم الاختيار', completed: 'كملت', cancelled: 'ملغى' }[s] || s;
}

async function viewOffers(requestId) {
  const offers = await API.call('GET', `/api/requests/${requestId}/offers`);
  const section = document.getElementById('offers-section');
  const list = document.getElementById('offers-list');
  section.classList.remove('hidden');
  if (offers.length === 0) {
    list.innerHTML = '<p class="small">ما وصلوش عروض تو، عاود شوف من بعد.</p>';
    return;
  }
  list.innerHTML = offers.map(o => `
    <div class="offer-row">
      <div>
        <strong>${o.provider_name}</strong>
        <div class="small">${o.rating_avg || '—'} ★ (${o.rating_count} تقييم) · ${o.eta_label}</div>
      </div>
      <div style="text-align:center;">
        <div class="lat" style="font-weight:600; font-size:1.1rem;">${o.price} د.ت</div>
        ${o.status === 'accepted'
          ? '<span class="badge">✓ مختار</span>'
          : `<button onclick="acceptOffer('${o.id}', '${requestId}')">اختار</button>`}
      </div>
    </div>
  `).join('');
}

async function acceptOffer(offerId, requestId) {
  await API.call('POST', `/api/offers/${offerId}/accept`);
  viewOffers(requestId);
  loadMyRequests();
}

function boot() {
  const user = API.user();
  if (!user) return;
  document.getElementById('auth-view').classList.add('hidden');
  document.getElementById('main-view').classList.remove('hidden');
  document.getElementById('who').textContent = user.full_name;
  loadServices();
  loadMyRequests();
}

boot();
