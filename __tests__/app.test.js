const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');
const UserService = require('../lib/services/UserService');

const mockUser = {
  email: 'dndfreak@gmail.com',
  password: 'fourfour44'
};

const registerAndLogin = async (userProps = {}) => {
  const password = userProps.password ?? mockUser.password;
  const agent = request.agent(app);
  const user = await UserService.create({ ...mockUser, ...userProps });

  const { email } = user;
  await agent.post('/api/v1/users/sessions').send({ email, password });
  return [agent, user];
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

  it('/protected should return a 401 if not authenticated', async () => {
    const res = await request(app).get('/api/v1/users/protected');
    expect(res.status).toEqual(401);
  });

  it('/protected should return the current user if authenticated', async () => {
    const [agent] = await registerAndLogin();
    const res = await agent.get('/api/v1/users/protected');
    expect(res.status).toEqual(200);
  });

  it('/users should return 403 if user not admin', async () => {
    const [agent] = await registerAndLogin();
    const res = await agent.get('/api/v1/users/');
    expect(res.status).toEqual(403);
  });

  it('/users should return a 200 if user is admin', async () => {
    const [agent] = await registerAndLogin({ email: 'admin' });
    const res = await agent.get('/api/v1/users/');
    expect(res.status).toEqual(200);
  });

  it('/DELETE sessions deletes user session, or logs out', async () => {
    const [agent] = await registerAndLogin();
    const res = await agent.delete('/api/v1/users/sessions');
    expect (res.status).toEqual(204);
  });

  it('/GET returns a list of secrets for authenticated users only', async () => {
    const [agent] = await registerAndLogin();
    const res = await agent.get('/api/v1/secrets');
    expect(res.body).toEqual([{
      id: expect.any(String),
      title: 'Project Unicorn',
      description: 'Bjork twinning',
      createdAt: expect.any(String),
    },
    {
      id: expect.any(String),
      title: 'Project Wow',
      description: 'Dogecoin rugpull',
      createdAt: expect.any(String),
    },
    {
      id: expect.any(String),
      title: 'Project Cerveza',
      description: 'obtain beer',
      createdAt: expect.any(String),
    }
    ]);
  });

  afterAll(() => {
    pool.end();
    
  });
});
