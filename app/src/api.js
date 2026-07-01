// Thin fetch wrapper around the existing Learnable Express API (../server.js).
// Auth is the server's httpOnly `token` cookie, so every call sends credentials
// and no token is ever handled in JS. Endpoints + shapes mirror server.js exactly.

async function req(path, { method = 'GET', body } = {}) {
  const opts = { method, credentials: 'include', headers: {} }
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(path, opts)
  let data = null
  try {
    data = await res.json()
  } catch {
    /* some endpoints may return no JSON body */
  }
  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`
    const err = new Error(message)
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  // config + auth
  config: () => req('/api/config'),
  me: () => req('/api/auth/me'),
  signup: (b) => req('/api/auth/signup', { method: 'POST', body: b }),
  login: (b) => req('/api/auth/login', { method: 'POST', body: b }),
  logout: () => req('/api/auth/logout', { method: 'POST' }),
  magic: (b) => req('/api/auth/magic', { method: 'POST', body: b }),
  magicVerify: (token) => req('/api/auth/magic/verify', { method: 'POST', body: { token } }),
  forgot: (b) => req('/api/auth/forgot', { method: 'POST', body: b }),
  reset: (b) => req('/api/auth/reset', { method: 'POST', body: b }),
  googleUrl: '/api/auth/google', // full-page redirect

  // profile + community
  updateProfile: (b) => req('/api/profile', { method: 'PUT', body: b }),
  alumni: (skill) =>
    req('/api/alumni' + (skill ? `?skill=${encodeURIComponent(skill)}` : '')),

  // programs
  generateProgram: (b) => req('/api/programs', { method: 'POST', body: b }),
  myPrograms: () => req('/api/programs'),
  getProgram: (id) => req(`/api/programs/${id}`),
  programCv: (id) => req(`/api/programs/${id}/cv`, { method: 'POST' }),
  enroll: (id) => req(`/api/programs/${id}/enroll`, { method: 'POST' }),
  startTrial: (id) => req(`/api/programs/${id}/trial`, { method: 'POST' }),
  verifyPayment: (ref) => req(`/api/payments/verify?ref=${encodeURIComponent(ref)}`),

  // course player
  courseState: (id) => req(`/api/courses/${id}/state`),
  lesson: (id, moduleIdx, lessonIdx) =>
    req(`/api/courses/${id}/lesson`, { method: 'POST', body: { moduleIdx, lessonIdx } }),
  saveProgress: (id, lessonKey, quizScore) =>
    req(`/api/courses/${id}/progress`, { method: 'POST', body: { lessonKey, quizScore } }),
  heartbeat: (id) => req(`/api/courses/${id}/heartbeat`, { method: 'POST' }),
  tutor: (id, messages, lessonTitle) =>
    req(`/api/courses/${id}/tutor`, { method: 'POST', body: { messages, lessonTitle } }),
  submitCapstone: (id) => req(`/api/courses/${id}/capstone`, { method: 'POST' }),

  // credentials
  certificates: () => req('/api/certificates'),
  verifyCred: (credId) => req(`/api/verify/${credId}`),
}
