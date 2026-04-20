// PLESK Startup file for Production
// This file acts as a CJS wrapper for the server
async function start() {
    const { default: _ } = await import('./server.js');
}
start().catch(err => {
    console.error('Failed to start server:', err);
});
