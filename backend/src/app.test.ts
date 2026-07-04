import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

const app = createApp();

// Tests d'endpoints sans base de données (health, validation, auth).
describe('API', () => {
  it('GET /api/health -> 200 ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/auth/login corps invalide -> 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'pas-un-email' });
    expect(res.status).toBe(400);
  });

  it('GET /api/sujets sans token -> 401', async () => {
    const res = await request(app).get('/api/sujets');
    expect(res.status).toBe(401);
  });

  it('GET /api/audit sans token -> 401', async () => {
    const res = await request(app).get('/api/audit');
    expect(res.status).toBe(401);
  });

  it('route inconnue -> 404', async () => {
    const res = await request(app).get('/api/inexistant');
    expect(res.status).toBe(404);
  });
});
