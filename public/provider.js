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
    const { token, user } = await API.call('POST', '/api/auth/register', { full_name, phone, password, role: 'provider' });
    API.setSession(token, user);
    boot();
  } catch (e) { document.getElementById('re-error').textContent = e.message; }
}

let servicesCache = [];

async function loadServices() {
  servicesCache = await API.call('GET', '/api/services');
  document.getElementById('p-service').innerHTML =
    servicesCache.map(s => `<option value="${s.id}">${s.name_ar} — ${s.name_fr}</option>`).join('');
}

async function loadProfile() {
  const profile = await API.call('GET', '/api/providers/me');
  if (profile.base_lat) {
    document.getElementById('p-radius').value = profile.travel_radius_km;
  }
  document.getElementById('my-services').innerHTML = profile.services.length
    ? profile.services.map(s => `<span class="badge" style="background:var(--primary); margin-inline-end:6px;">${s.name_ar}</span>`).join('')
    : '<p class="small">ما زدتش خدمات باهي.</p>';
  return profile;
}

async function saveLocation() {
  const zone = document.getElementById('p-zone').value;
  const radius = Number(document.getElementById('p-radius').value) || 10;
  const [lat, lng] = ZONES[zone];
  try {
    await API.call('PUT', '/api/providers/me', { base_lat: lat, base_lng: lng, travel_radius_km: radius });
    document.getElementById('loc-error').textContent = '✓ تحفظت';
    loadNearby();
  } catch (e) { document.getElementById('loc-error').textContent = e.message; }
}

async function addService() {
  const service_id = document.getElementById('p-service').value;
  await API.call('POST', '/api/providers/me/services', { service_id });
  loadProfile();
  loadNearby();
}

async function loadNearby() {
  const rows = await API.call('GET', '/api/requests/nearby');
  const box = document.getElementById('nearby-requests');
  if (rows.length === 0) {
    box.innerHTML = '<p class="small">ما فماش طلبات قريبة تو.</p>';
    return;
  }
  box.innerHTML = rows.map(r => `
    <div class="request-item">
      <div><strong>${r.service_name}</strong> — <span class="small">${r.address_label} · ${r.distance_km.toFixed(1)} كم</span></div>
      <div class="small">${r.description}</div>
      <div style="display:flex; gap:8px; margin-top:8px;">
        <input type="number" placeholder="الثمن (د.ت)" id="price-${r.id}" style="width:110px;">
        <input type="text" placeholder="المدة، مثال: اليوم بعد ساعتين" id="eta-${r.id}" style="flex:1;">
        <button onclick="sendOffer('${r.id}')">ابعث عرض</button>
      </div>
    </div>
  `).join('');
}

async function sendOffer(requestId) {
  const price = document.getElementById(`price-${requestId}`).value;
  const eta_label = document.getElementById(`eta-${requestId}`).value;
  if (!price || !eta_label) return alert('حط الثمن والمدة');
  await API.call('POST', `/api/requests/${requestId}/offers`, { price: Number(price), eta_label });
  loadNearby();
}

function boot() {
  const user = API.user();
  if (!user) return;
  document.getElementById('auth-view').classList.add('hidden');
  document.getElementById('main-view').classList.remove('hidden');
  document.getElementById('who').textContent = user.full_name;
  loadServices().then(loadProfile).then(loadNearby);
}

boot();
