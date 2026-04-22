import { afterEach, before, test } from 'node:test';
import assert from 'node:assert/strict';

import bcrypt from 'bcryptjs';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DEPARTMENT_SLUG = 'computer-science';
process.env.CORS_ORIGIN = '*';

const { default: app } = await import('../src/app.js');
const { Student } = await import('../src/models/student.js');
const { Faculty } = await import('../src/models/faculty.js');

const originalStudentFindOne = Student.findOne;
const originalFacultyFindOne = Faculty.findOne;
const originalCompare = bcrypt.compare;

const activeStudent = {
  id: '507f191e810c19729de860ea',
  name: 'Aarav Student',
  email: 'student@college.edu',
  password: 'Password@123',
};

const activeFaculty = {
  id: '507f191e810c19729de860eb',
  name: 'Meera Faculty',
  email: 'faculty@college.edu',
  password: 'Password@123',
};

before(() => {
  Student.findOne = originalStudentFindOne;
  Faculty.findOne = originalFacultyFindOne;
  bcrypt.compare = originalCompare;
});

afterEach(() => {
  Student.findOne = originalStudentFindOne;
  Faculty.findOne = originalFacultyFindOne;
  bcrypt.compare = originalCompare;
});

test('GET /api/health returns ok', async () => {
  const response = await request(app).get('/api/health');

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.status, 'ok');
});

test('POST /api/auth/login rejects missing fields', async () => {
  const response = await request(app).post('/api/auth/login').send({ email: '' });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.message, 'Email, password, and role are required.');
});

test('POST /api/auth/login rejects invalid role', async () => {
  const response = await request(app).post('/api/auth/login').send({
    email: 'student@college.edu',
    password: 'Password@123',
    role: 'hod',
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.message, 'Role must be either student or faculty.');
});

test('POST /api/auth/login rejects invalid email format', async () => {
  const response = await request(app).post('/api/auth/login').send({
    email: 'student-at-college',
    password: 'Password@123',
    role: 'student',
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.message, 'Please enter a valid email address.');
});

test('POST /api/auth/login checks the students collection for student login', async () => {
  let receivedQuery;
  Student.findOne = async (query) => {
    receivedQuery = query;
    return null;
  };
  Faculty.findOne = async () => {
    throw new Error('Faculty collection should not be used for student login');
  };

  const response = await request(app).post('/api/auth/login').send({
    email: 'student@college.edu',
    password: 'Password@123',
    role: 'student',
  });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(receivedQuery, { email: 'student@college.edu' });
});

test('POST /api/auth/login checks the faculty collection for faculty login', async () => {
  let receivedQuery;
  Faculty.findOne = async (query) => {
    receivedQuery = query;
    return null;
  };
  Student.findOne = async () => {
    throw new Error('Student collection should not be used for faculty login');
  };

  const response = await request(app).post('/api/auth/login').send({
    email: 'faculty@college.edu',
    password: 'Password@123',
    role: 'faculty',
  });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(receivedQuery, { email: 'faculty@college.edu' });
});

test('POST /api/auth/login rejects unknown account', async () => {
  Student.findOne = async () => null;

  const response = await request(app).post('/api/auth/login').send({
    email: 'missing@college.edu',
    password: 'Password@123',
    role: 'student',
  });

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.message, 'No account was found for these login details.');
});

test('POST /api/auth/login rejects wrong plain-text password', async () => {
  Student.findOne = async () => activeStudent;

  const response = await request(app).post('/api/auth/login').send({
    email: 'student@college.edu',
    password: 'WrongPassword',
    role: 'student',
  });

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.message, 'Incorrect password.');
});

test('POST /api/auth/login supports hashed passwords too', async () => {
  Student.findOne = async () => ({
    ...activeStudent,
    password: '$2b$10$012345678901234567890uW5oVQxK5vCk1vZ1tcHTTX3e8DqRLVQK',
  });
  bcrypt.compare = async () => true;

  const response = await request(app).post('/api/auth/login').send({
    email: 'student@college.edu',
    password: 'Password@123',
    role: 'student',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
});

test('POST /api/auth/login succeeds for a valid student login', async () => {
  Student.findOne = async () => activeStudent;

  const response = await request(app).post('/api/auth/login').send({
    email: 'student@college.edu',
    password: 'Password@123',
    role: 'student',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.user.email, 'student@college.edu');
  assert.equal(response.body.user.role, 'student');
  assert.equal(response.body.user.fullName, 'Aarav Student');
  assert.ok(response.body.token);
});

test('POST /api/auth/login succeeds for a valid faculty login', async () => {
  Faculty.findOne = async () => activeFaculty;

  const response = await request(app).post('/api/auth/login').send({
    email: 'faculty@college.edu',
    password: 'Password@123',
    role: 'faculty',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.user.email, 'faculty@college.edu');
  assert.equal(response.body.user.role, 'faculty');
  assert.equal(response.body.user.fullName, 'Meera Faculty');
  assert.ok(response.body.token);
});
