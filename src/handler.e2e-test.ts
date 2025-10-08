import { HttpStatus } from './constants.js';
import { HandlerEvent, HandlerResponse, TRequest, TResponse } from './types.js';
import LocalServer from './fixtures/server.js';

describe('Integration Tests', () => {
  const localSever = new LocalServer();
  let sampleEvent: HandlerEvent<TRequest>;
  let fetchSpy: jest.SpyInstance;
  let handler: (event: HandlerEvent<TRequest>) => Promise<HandlerResponse>;

  beforeAll(async () => {
    await localSever.start();

    handler = require('./fixtures/handler.cjs');

    fetchSpy = jest.spyOn(global, 'fetch');
  });

  beforeEach(() => {
    fetchSpy.mockClear();
    sampleEvent = {
      secrets: { authorization: 'Bearer fake-access-token' },
      request: {
        headers: { 'Content-Type': 'application/json' },
        body: {} as TRequest
      },
      context: {
        spark_url: localSever.baseUrl,
        tenant: 'my-tenant',
        service_uri: 'integration/sample-test'
      }
    };
  });

  afterAll(async () => {
    fetchSpy.mockRestore();
    await localSever.stop();
  });

  test('handler() should return non-OK HTTP if wrong settings are provided', async () => {
    sampleEvent.context.service_uri = 'invalid-service-uri';
    const res = await handler(sampleEvent);

    expect(res.http_status_code).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(res.headers['X-Transform-Elapsed-Time']).toBeDefined();
    expect(res.body).toBeDefined();
    expect((res.body as TResponse)?.message).toBeDefined();
  });

  test('handler() should handle sample request', async () => {
    sampleEvent.request.body = { radius_field: 3.4, height_field: 4.5 };
    const res = await handler(sampleEvent);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/my-tenant/api/v3/folders/integration/services/sample-test/execute'),
      expect.anything()
    );

    expect(res.http_status_code).toBe(200);
    expect(res.headers['X-Transform-Elapsed-Time']).toBeDefined();
    expect(res.body).toBeDefined();

    const sampleResponse = res.body as TResponse;
    expect(sampleResponse?.volume_field).toBeDefined();
    expect(sampleResponse?.volume_field).toBe(163.426);
  });
});
