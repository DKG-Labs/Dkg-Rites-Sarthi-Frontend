const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    // Proxy /sleeper/ to the Sleeper Dashboard dev server (Vite) on port 5173
    app.use(
        '/sleeper',
        createProxyMiddleware({
            target: 'http://localhost:5173',
            changeOrigin: true,
            secure: false,
            ws: false, // disable proxying websockets, let Vite handle it directly
            xfwd: true,
            onError: (err, req, res) => {
                if (err.code === 'ECONNRESET') {
                    console.warn('[HPM] WebSocket connection reset (likely Vite HMR restart)');
                } else {
                    console.error('[HPM] Proxy error:', err);
                }
            }
        })
    );

    // Proxy /railpad/ to the Railpad IE dev server (Vite) on port 5174
    app.use(
        '/railpad',
        createProxyMiddleware({
            target: 'http://localhost:5174',
            changeOrigin: true,
            secure: false,
            ws: false, // disable proxying websockets, let Vite handle it directly
            xfwd: true,
            onError: (err, req, res) => {
                if (err.code === 'ECONNRESET') {
                    console.warn('[HPM] WebSocket connection reset (likely Vite HMR restart)');
                } else {
                    console.error('[HPM] Proxy error:', err);
                }
            }
        })
    );
};
