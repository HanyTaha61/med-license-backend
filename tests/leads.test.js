import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../app.js';

let mongo;
let app;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const validLead = () => ({
  fullName: 'Ahmed Hassan',
  phone: '+201001234567',
  profession: 'doctor',
  specialty: 'Cardiology',
  targetCountry: 'saudi-arabia',
  serviceType: 'dataflow',
  consentToShare: true
});

test('health endpoint responds successfully', async () => {
  const response = await request(app).get('/api/v1/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

test('valid lead is accepted and returns a reference only', async () => {
  const response = await request(app).post('/api/v1/leads').send(validLead());
  assert.equal(response.status, 201);
  assert.match(response.body.data.reference, /^ML-[A-F0-9]{8}$/);
  assert.equal(response.body.data.phone, undefined);
});

test('missing consent is rejected', async () => {
  const payload = validLead();
  delete payload.consentToShare;
  const response = await request(app).post('/api/v1/leads').send(payload);
  assert.equal(response.status, 400);
  assert.ok(response.body.errors.some(message => message.toLowerCase().includes('consent')));
});

test('unsupported destination country is rejected', async () => {
  const response = await request(app).post('/api/v1/leads').send({ ...validLead(), targetCountry: 'mars' });
  assert.equal(response.status, 400);
});

test('same phone, country and service cannot submit duplicate within 24 hours', async () => {
  const payload = validLead();
  const first = await request(app).post('/api/v1/leads').send(payload);
  const second = await request(app).post('/api/v1/leads').send(payload);
  assert.equal(first.status, 201);
  assert.equal(second.status, 409);
});
