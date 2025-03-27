module.exports = {
  apps: [{
    name: 'blogapp',
    script: 'index.js',
    instances: 1,  // Run just one instance
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};