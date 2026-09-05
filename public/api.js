const API = {
  base: '',
  token() { return localStorage.getItem('sahlio_token'); },
  user() { return JSON.parse(localStorage.getItem('sahlio_user') || 'null'); },
  setSession(token, user) {
    localStorage.setItem('sahlio_token', token);
    localStorage.setItem('sahlio_user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('sahlio_token');
    localStorage.removeItem('sahlio_user');
    location.reload();
  },
  async call(method, path, body) {
    const res = await fetch(this.base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token() ? { Authorization: 'Bearer ' + this.token() } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'صار مشكل، عاود جرب');
    return data;
  }
};

// A few preset Grand Tunis coordinates so the demo doesn't need a real map picker yet
const ZONES = {
  'تونس': [36.8065, 10.1815],
  'أريانة': [36.8625, 10.1956],
  'بن عروس': [36.7533, 10.2282],
  'منوبة': [36.8081, 10.0972],
};
