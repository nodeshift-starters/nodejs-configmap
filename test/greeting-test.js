const test = require('tape');
const proxyquire = require('proxyquire');
const supertest = require('supertest');
const sinon = require('sinon');

test('test basic greeting api', (t) => {
  const clock = sinon.useFakeTimers();
  const app = proxyquire('../app', {
    'js-yaml': {
      safeLoad: (data) => {
        return data;
      }
    },
    'openshift-rest-client': () => {
      return Promise.resolve({
        configmaps: {
          find: (configMapName) => {
            const configMap = {
              data: {
                'app-config.yml': {
                  message: 'Hello, %s from a ConfigMap !',
                  level: 'INFO'
                }
              }
            };
            return Promise.resolve(configMap);
          }
        }
      });
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

test('test basic greeting api with name', (t) => {
  const clock = sinon.useFakeTimers();
  const app = proxyquire('../app', {
    'js-yaml': {
      safeLoad: (data) => {
        return data;
      }
    },
    'openshift-rest-client': () => {
      return Promise.resolve({
        configmaps: {
          find: (configMapName) => {
            const configMap = {
              data: {
                'app-config.yml': {
                  message: 'Hello, %s from a ConfigMap !',
                  level: 'INFO'
                }
              }
            };
            return Promise.resolve(configMap);
          }
        }
      });
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

test('test greeting api - no configmap yet', (t) => {
  const clock = sinon.useFakeTimers();
  const app = proxyquire('../app', {
    'js-yaml': {
      safeLoad: (data) => {
        return data;
      }
    },
    'openshift-rest-client': () => {
      return Promise.resolve({
        configmaps: {
          find: (configMapName) => {
            const configMap = {
              data: {
                'app-config.yml': {
                  message: 'Hello, %s from a ConfigMap !',
                  level: 'INFO'
                }
              }
            };
            return Promise.resolve(configMap);
          }
        }
      });
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

test('test basic greeting api - check for configmap, but nothing', (t) => {
  const clock = sinon.useFakeTimers();
  const app = proxyquire('../app', {
    'js-yaml': {
      safeLoad: (data) => {
        return data;
      }
    },
    'openshift-rest-client': () => {
      return Promise.resolve({
        configmaps: {
          find: (configMapName) => {
            const configMap = {
              data: {
              }
            };
            return Promise.resolve(configMap);
          }
        }
      });
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

test('test logger change', (t) => {
  const clock = sinon.useFakeTimers();
  const findStub = sinon.stub();
  findStub.onCall(0).returns(Promise.resolve({
    data: {
      'app-config.yml': {
        message: 'Hello, %s from a ConfigMap !',
        level: 'INFO'
      }
    }
  })
  );

  findStub.onCall(1).returns(Promise.resolve({
    data: {
      'app-config.yml': {
        message: 'Hello, %s from a ConfigMap !',
        level: 'DEBUG'
      }
    }
  })
  );

  const app = proxyquire('../app', {
    'js-yaml': {
      safeLoad: (data) => {
        return data;
      }
    },
    'winston': {
      level: 'info',
      info: () => {},
      debug: () => {}
    },
    'openshift-rest-client': () => {
      return Promise.resolve({
        configmaps: {
          find: findStub
        }
      });
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
