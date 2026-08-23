module.exports = {
  apps: [
    {
      name: 'classy-arabic-frontend',
      script: 'pnpm',
      args: 'start',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000 // You can change this port to whatever your Nginx proxy expects for the frontend
      }
    },
    {
      name: 'classy-arabic-backend',
      script: 'uv',
      args: 'run uvicorn app.main:app --host 127.0.0.1 --port 8000',
      cwd: './backend',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PORT: 8000 // You can change this port to whatever your Nginx proxy expects for the backend
      }
    }
  ]
};
