const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    // Proxy /sleeper/ to the Sleeper Dashboard dev server (Vite) on port 5173
    app.use(
        '/sleeper/',
        createProxyMiddleware({
            target: 'http://localhost:5173',
            changeOrigin: true,
        })
    );
};
