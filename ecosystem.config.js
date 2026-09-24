module.exports = {
  apps: [
    {
      name: 'backend-laboratoriumsda',
      script: 'index.js',
      instances: 1, // 1 proses agar cron scheduler tidak jalan dobel
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
