const test = require('tape');
const proxyquire = require('proxyquire');
const supertest = require('supertest');
const sinon = require('sinon');

test('test basic greeting api', t => {
  const clock = sinon.useFakeTimers();
  const app = proxyquire('../app', {
    'js-yaml': {
      safeLoad: data => {
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

  supertest(app)
    .get('/api/greeting')
    .expect('Content-Type', /json/)
    .expect(200)
    .then(response => {
      t.equal(response.body.content, 'Hello, World from a ConfigMap !', 'should have a content message');
      clock.restore();
      t.end();
    });
});

test('test basic greeting api with name', t => {
  const clock = sinon.useFakeTimers();
  const app = proxyquire('../app', {
    'js-yaml': {
      safeLoad: data => {
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

  supertest(app)
    .get('/api/greeting?name=luke')
    .expect('Content-Type', /json/)
    .expect(200)
    .then(response => {
      t.equal(response.body.content, 'Hello, luke from a ConfigMap !', 'should have a content message');
      clock.restore();
      t.end();
    });
});

test('test greeting api - no configmap yet', t => {
  const clock = sinon.useFakeTimers();
  const app = proxyquire('../app', {
    'js-yaml': {
      safeLoad: data => {
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

  supertest(app)
    .get('/api/greeting')
    .expect(500)
    .then(response => {
      t.equal(response.body.content, 'no config map', 'should have a content message');
      clock.restore();
      t.end();
    });
});

test('test basic greeting api - check for configmap, but nothing', t => {
  const clock = sinon.useFakeTimers();
  const app = proxyquire('../app', {
    'js-yaml': {
      safeLoad: data => {
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

  supertest(app)
    .get('/api/greeting')
    .expect('Content-Type', /json/)
    .expect(500)
    .then(response => {
      t.equal(response.body.content, 'no config map', 'should have a content message');
      clock.restore();
      t.end();
    });
});

test('test logger change', t => {
  const clock = sinon.useFakeTimers();
  const app = proxyquire('../app', {
    'js-yaml': {
      safeLoad: data => {
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

  clock.tick(2100);

  supertest(app)
    .get('/api/greeting?name=luke')
    .expect('Content-Type', /json/)
    .expect(200)
    .then(response => {
      t.equal(response.body.content, 'Hello, luke from a ConfigMap !', 'should have a content message');
      clock.restore();
      t.end();
    });
});
