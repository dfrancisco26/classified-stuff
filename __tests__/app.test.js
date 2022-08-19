const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');

const mockUser = {
  email: 'dndfreak@gmail.com',
  password: 'fourfour44'
};

describe('CRUD routes', () => {
  beforeEach(() => {
    return setup(pool);
  });
  
  it('creates a new user', async () => {
    const res = await request(app).post('/api/v1/users').send(mockUser);
    const { email } = mockUser;
    expect(res.body).toEqual({
      id: expect.any(String),
      email,
    });
  });

  it('signs in existing user', async () => {
    await request(app).post('/api/v1/users').send(mockUser);
    const res = await request(app)
      .post('/api/v1/users/sessions')
      .send({ email: 'dndfreak@gmail.com', password: 'fourfour44' });
    expect(res.status).toEqual(200);
  });

  afterAll(() => {
    pool.end();
    
  });
});
