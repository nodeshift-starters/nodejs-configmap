const test = require('ava');
const OpenshiftTestAssistant = require('openshift-test-assistant');
const openshiftAssistant = new OpenshiftTestAssistant();

const configMapName = 'app-config';
const messageAttrName = 'message';
let restClient;
test.before('setup', async () => {
  restClient = await openshiftAssistant.getRestClient();
  await openshiftAssistant.deploy();
});

/**
 Ensure that config map is available before each test
 */
test.before('recreate config map', async () => {
  await createConfigMapIfNotExist();
});

test('no configmap', async (t) => {
  t.plan(1);
  await deleteConfigMap();
  await rolloutChanges();
  const response = await openshiftAssistant.createRequest()
    .get('/api/greeting')
    .expect('Content-Type', /json/)
    .expect(500);
  t.is(response.body.content, 'no config map');
});

test('configmap no param', async (t) => {
  t.plan(1);
  const response = await openshiftAssistant.createRequest()
    .get('/api/greeting')
    .expect('Content-Type', /json/)
    .expect(200);
  t.is(response.body.content, 'Bonjour World from config map');
});

test('configmap with param', async (t) => {
  t.plan(1);
  const response = await openshiftAssistant.createRequest()
    .get('/api/greeting?name=Luke')
    .expect('Content-Type', /json/)
    .expect(200);
  t.is(response.body.content, 'Bonjour Luke from config map');
});

test.after.always('teardown', () => {
  deleteConfigMap();
  return openshiftAssistant.undeploy();
});

async function deleteConfigMap () {
  restClient.configmaps.removeAll();
}

/**
 * Apply changes of config map by forcing a recreation of the pod
 * @returns {Promise<void>}
 */
async function rolloutChanges () {
  await openshiftAssistant.scale(0);
  await openshiftAssistant.scale(1);
}

/**
 * Check if config map exists and if not, create it and wait for it to take effect
 * @returns {Promise<void>}
 */
async function createConfigMapIfNotExist () {
  const map = await restClient.configmaps.find(configMapName);
  if (map !== undefined) {
    await createConfigMap();
    await rolloutChanges();
  }
}

/**
 * Create config
 * @returns Promise<configMap>
 */
function createConfigMap () {
  const configMap = {
    metadata: {
      name: configMapName
    },
    data: {
      'app-config.yml': messageAttrName + ': "Bonjour %s from config map"\nlevel: "basic"'
    }
  };
  return restClient.configmaps.create(configMap);
}
