import http from 'node:http';
import { once } from 'node:events';

// A simple local server for testing purposes.
export default class LocalServer {
  private server: http.Server;

  constructor(readonly hostname: string = 'localhost') {
    this.server = http.createServer(this.router);
    this.server.keepAliveTimeout = 1000;
    this.server.on('error', (err) => console.error(err.stack));
    this.server.on('connection', (socket) => socket.setTimeout(1500));
  }

  async start() {
    this.server.listen(0, this.hostname);
    return once(this.server, 'listening');
  }

  async stop() {
    this.server.close();
    return once(this.server, 'close');
  }

  get port() {
    const address = this.server.address();
    return typeof address === 'string' ? address : address?.port;
  }

  get baseUrl() {
    return `http://${this.hostname}:${this.port}`;
  }

  router(req: http.IncomingMessage, res: http.ServerResponse) {
    const pathname = req.url;

    if (pathname === '/my-tenant/api/v3/folders/my-folder/services/my-service/execute') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(`{"status": "Success", "response_data": {"outputs": {"alerts": "Autobots approaching"}}}`);
    } else if (pathname === '/my-tenant/api/v3/folders/my-folder/services/service-not-found/execute') {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(`{"status": "Error", "error": "Service not found"}`);
    } else if (pathname === '/my-tenant/api/v3/folders/integration/services/sample-test/execute') {
      const sampleResponse = require('../../assets/spark-response.json');

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(sampleResponse));
    } else {
      // Handle unmatched routes to prevent hanging connections
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(`{"error": "Route not found: ${pathname}"}`);
    }
  }
}
