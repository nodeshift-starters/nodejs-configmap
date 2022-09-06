/* eslint-disable no-undef */
const assert = require('assert');
const proxyquire = require('proxyquire');
const supertest = require('supertest');
const sinon = require('sinon');

describe('Greeting API', () => {
  it('basic test', async () => {
    const clock = sinon.useFakeTimers();
    const app = proxyquire('../app', {
      'js-yaml': {
        load: data => {
          return data;
        }
      },
      fs: {
        readFile: (location, options, cb) => {
          const configmap = {
            message: 'Hello, %s from a ConfigMap !',
            level: 'INFO'
          };
          return cb(null, configmap);
        }
      }
    });

    clock.tick(2100);
    const { body } = await supertest(app)
      .get('/api/greeting')
      .expect('Content-Type', /json/)
      .expect(200);

    assert.strictEqual(body.content, 'Hello, World from a ConfigMap !');
    clock.restore();
  });

  it('with name', async () => {
    const clock = sinon.useFakeTimers();
    const app = proxyquire('../app', {
      'js-yaml': {
        load: data => {
          return data;
        }
      },
      fs: {
        readFile: (location, options, cb) => {
          const configmap = {
            message: 'Hello, %s from a ConfigMap !',
            level: 'INFO'
          };
          return cb(null, configmap);
        }
      }
    });
    clock.tick(2100);
    const { body } = await supertest(app)
      .get('/api/greeting?name=luke')
      .expect('Content-Type', /json/)
      .expect(200);

    assert.strictEqual(body.content, 'Hello, luke from a ConfigMap !');
    clock.restore();
  });

  it('no configmap yet', async () => {
    const clock = sinon.useFakeTimers();
    const app = proxyquire('../app', {
      'js-yaml': {
        load: data => {
          return data;
        }
      },
      fs: {
        readFile: (location, options, cb) => {
          const configmap = {
            message: 'Hello, %s from a ConfigMap !',
            level: 'INFO'
          };
          return cb(null, configmap);
        }
      }
    });

    const { body } = await supertest(app)
      .get('/api/greeting')
      .expect(500);

    assert.strictEqual(body.content, 'no config map');
    clock.restore();
  });

  it('check for configmap, but nothing', async () => {
    const clock = sinon.useFakeTimers();
    const app = proxyquire('../app', {
      'js-yaml': {
        load: data => {
          return data;
        }
      },
      fs: {
        readFile: (location, options, cb) => {
          return cb(null, null);
        }
      }
    });

    clock.tick(2100);
    const { body } = await supertest(app)
      .get('/api/greeting')
      .expect('Content-Type', /json/)
      .expect(500);

    assert.strictEqual(body.content, 'no config map');
    clock.restore();
  });

  it('logger change', async () => {
    const clock = sinon.useFakeTimers();
    const app = proxyquire('../app', {
      'js-yaml': {
        load: data => {
          return data;
        }
      },
      winston: {
        level: 'info',
        info: () => {},
        debug: () => {}
      },
      fs: {
        readFile: (location, options, cb) => {
          return cb(null, {
            message: 'Hello, %s from a ConfigMap !',
            level: 'DEBUG'
          });
        }
      }
    });
    clock.tick(2100);

    const { body } = await supertest(app)
      .get('/api/greeting?name=luke')
      .expect('Content-Type', /json/)
      .expect(200);

    assert.strictEqual(body.content, 'Hello, luke from a ConfigMap !');
    clock.restore();
  });
});
