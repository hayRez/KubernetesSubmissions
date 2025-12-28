const k8s = require('@kubernetes/client-node');
const axios = require('axios');

const kc = new k8s.KubeConfig();
kc.loadFromCluster();

const customApi = kc.makeApiClient(k8s.CustomObjectsApi);
const coreApi = kc.makeApiClient(k8s.CoreV1Api);

const namespace = 'default';

// Helper to sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createOrUpdateConfigMap(name, html) {
  const cm = {
    metadata: { name: `${name}-html` },
    data: { 'index.html': html }
  };

  try {
    await coreApi.createNamespacedConfigMap(namespace, cm);
    console.log(`Created ConfigMap ${name}-html`);
  } catch (err) {
    if (err.body && err.body.reason === 'AlreadyExists') {
      await coreApi.replaceNamespacedConfigMap(`${name}-html`, namespace, cm);
      console.log(`Updated existing ConfigMap ${name}-html`);
    } else {
      console.error('Error creating ConfigMap:', err.body || err);
    }
  }
}

async function createOrUpdatePod(name) {
  const pod = {
    metadata: { name: `${name}-pod`, labels: { app: name } },
    spec: {
      containers: [{
        name: 'nginx',
        image: 'nginx:alpine',
        volumeMounts: [{
          name: 'html',
          mountPath: '/usr/share/nginx/html'
        }]
      }],
      volumes: [{
        name: 'html',
        configMap: { name: `${name}-html` }
      }]
    }
  };

  try {
    await coreApi.createNamespacedPod(namespace, pod);
    console.log(`Created Pod ${name}-pod`);
  } catch (err) {
    if (err.body && err.body.reason === 'AlreadyExists') {
      console.log(`Pod ${name}-pod already exists, skipping creation`);
    } else {
      console.error('Error creating Pod:', err.body || err);
    }
  }
}

async function createOrUpdateService(name) {
  const svc = {
    metadata: { name: `${name}-service` },
    spec: {
      selector: { app: name },
      ports: [{ port: 80, targetPort: 80 }]
    }
  };

  try {
    await coreApi.createNamespacedService(namespace, svc);
    console.log(`Created Service ${name}-service`);
  } catch (err) {
    if (err.body && err.body.reason === 'AlreadyExists') {
      console.log(`Service ${name}-service already exists, skipping creation`);
    } else {
      console.error('Error creating Service:', err.body || err);
    }
  }
}

async function createSite(name, url) {
  try {
    console.log(`Creating site for ${url}`);
    const response = await axios.get(url);
    const html = response.data;

    await createOrUpdateConfigMap(name, html);
    await createOrUpdatePod(name);
    await createOrUpdateService(name);
  } catch (err) {
    console.error(`Failed to create site ${name}:`, err.message || err);
  }
}

async function watchDummySites() {
  const watch = new k8s.Watch(kc);

  const startWatch = async () => {
    try {
      await watch.watch(
        `/apis/example.com/v1/namespaces/${namespace}/dummysites`,
        {},
        async (type, obj) => {
          if (type === 'ADDED') {
            const name = obj.metadata.name;
            const url = obj.spec.website_url;
            await createSite(name, url);
          }
        },
        (err) => {
          if (err) {
            console.error('Watch error, retrying in 5s', err);
            setTimeout(startWatch, 5000);
          }
        }
      );
      console.log('Watching DummySite resources...');
    } catch (err) {
      console.error('Failed to start watch, retrying in 5s', err);
      setTimeout(startWatch, 5000);
    }
  };

  startWatch();
}

// Keep the process alive in case of uncaught errors
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

watchDummySites();
