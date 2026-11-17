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
                } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
                    console.warn(`[HPM] Sleeper dev server on port 5173 is unreachable (${err.code}). Run 'npm run dev:sleeper' if using Sleeper.`);
                    if (res && typeof res.writeHead === 'function' && !res.headersSent) {
                        res.writeHead(504, { 'Content-Type': 'text/plain' });
                        res.end('Gateway Timeout: Sleeper dev server not running on port 5173.');
                    }
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
                } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
                    console.warn(`[HPM] Railpad dev server on port 5174 is unreachable (${err.code}). Run 'npm run dev:railpad' if using Railpad.`);
                    if (res && typeof res.writeHead === 'function' && !res.headersSent) {
                        res.writeHead(504, { 'Content-Type': 'text/plain' });
                        res.end('Gateway Timeout: Railpad dev server not running on port 5174.');
                    }
                } else {
                    console.error('[HPM] Proxy error:', err);
                }
            }
        })
    );

    // Proxy /sarthi-backend to the Spring Boot backend on port 8080
    app.use(
        '/sarthi-backend',
        createProxyMiddleware({
            target: 'http://localhost:8080',
            changeOrigin: true,
            secure: false
        })
    );
};
