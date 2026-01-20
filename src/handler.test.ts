import { HandlerEvent } from './types.js';
import { HttpStatus } from './constants.js';
import { Utils, isJsonatable } from './utils.js';
import LocalServer from './fixtures/server.js';

describe('Utils', () => {
  test('isJsonatable() checks whether the expression is a valid JSONata expression', () => {
    // valid cases
    expect(isJsonatable('$')).toBe(true);
    expect(isJsonatable(`{"a": $}`)).toBe(true);
    expect(isJsonatable(`$.nested.value`)).toBe(true);
    expect(isJsonatable(`$sum([1..42])`)).toBe(true);

    // invalid cases
    expect(isJsonatable('')).toBe(false);
    expect(isJsonatable('(;)')).toBe(false);
  });

  test('compileAndRun() should compile and run a valid JSONata expression', async () => {
    const total = await Utils.compileAndRun(`$sum([1..42])`, {}); // independent of input
    expect(total).toBe(903); // 1 + 2 + ... + 42 = 903

    const input = { bool: true, num: 42, str: 'hello', obj: { arr: [1, 2, 3] } };
    const expr = `
    (
      $multiply := function($i, $j){$i * $j};
      $total := $reduce($.obj.arr, $multiply);

      /* a simple comment */
      {
        "greeting": $.str & " world",
        "total": $total
      }
    )
    `;
    const result = await Utils.compileAndRun(expr, input);
    expect(result).toEqual({ greeting: 'hello world', total: 6 });
  });

  test('compileAndRun() should throw a bad request error if the expression is invalid', async () => {
    try {
      // Forcing this compile time error: "The symbol \"}\" cannot be used as a unary operator"
      await Utils.compileAndRun(`{"a": $.}`, {});
    } catch (err) {
      expect(err.status).toBe(HttpStatus.BAD_REQUEST);
      expect(err.body.error.message).toContain('cannot be used as a unary operator');
    }
  });

  test('parseXml() should validate and parse an XML string into a JavaScript object', () => {
    const parsed = Utils.parseXml('<person><name>John</name><age>30</age></person>');
    expect(parsed).toEqual({ person: { name: 'John', age: 30 } });
  });

  test('parseXml() should throw a bad request error if the XML is invalid', () => {
    try {
      Utils.parseXml('fake-xml-string');
    } catch (err) {
      expect(err.status).toBe(HttpStatus.BAD_REQUEST);
      expect(err.body.error.message).toBeDefined();
    }
  });

  test('toXml() should convert a JavaScript object to an XML string', () => {
    const xml = Utils.toXml({ person: { name: 'John', age: 30 } });
    expect(xml).toEqual('<person><name>John</name><age>30</age></person>');
  });

  test('populateResponse() should return handler-acceptable HttpResponse', () => {
    const response = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { greeting: 'Hello, world!' }
    };
    const result: any = Utils.populateResponse(response);
    expect(result.http_status_code).toBe(HttpStatus.OK);
    expect(result.headers['Content-Type']).toEqual('application/json');
    expect(result.body.greeting).toEqual('Hello, world!');
    expect(result.body.__debugger).toBeUndefined();
  });
});

describe('Handler', () => {
  const localSever = new LocalServer();
  let defaultEvent: HandlerEvent;
  let fetchSpy: jest.SpyInstance;

  beforeAll(async () => {
    await localSever.start();
    fetchSpy = jest.spyOn(global, 'fetch');
    defaultEvent = {
      secrets: { authorization: 'Bearer fake-access-token' },
      request: { body: {}, headers: { 'Content-Type': 'application/json' } },
      context: {
        spark_url: localSever.baseUrl,
        tenant: 'my-tenant',
        service_uri: 'my-folder/my-service',
        source_system: 'Decepticons',
        call_purpose: 'Transform'
      }
    };
  });

  afterAll(async () => {
    fetchSpy.mockRestore();
    await localSever.stop();
  });

  test('Utils.makeRequest() should know how to make a request to Spark Execute API', async () => {
    const res: any = await Utils.makeRequest(defaultEvent, { hello: 'transformers' });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/my-tenant/api/v3/folders/my-folder/services/my-service/execute'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"request_data":{"inputs":{"hello":"transformers"}}'),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-tenant-name': 'my-tenant',
          Authorization: 'Bearer fake-access-token'
        })
      })
    );

    // Parse the body to verify the structure separately
    const callArgs = fetchSpy.mock.calls[0];
    const requestBody = JSON.parse(callArgs[1].body);
    expect(requestBody.request_data.inputs).toEqual({ hello: 'transformers' });
    expect(requestBody.request_meta).toEqual(
      expect.objectContaining({
        call_purpose: 'Transform',
        compiler_type: 'Neuron',
        source_system: 'Decepticons'
      })
    );

    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.status).toBe('Success');
    expect(res.body.response_data.outputs).toBeDefined();
    expect(res.body.response_data.outputs.alerts).toBe('Autobots approaching');
  });

  test('Utils.makeRequest() should throw an error if something goes wrong', async () => {
    const notFoundEvent = {
      ...defaultEvent,
      context: { ...defaultEvent.context, service_uri: 'my-folder/service-not-found' }
    };

    try {
      await Utils.makeRequest(notFoundEvent, null); // should throw an error
    } catch (err) {
      expect(err.status).toBe(HttpStatus.NOT_FOUND);
      expect(err.body.message).toContain('Not Found'); // expected statusText
    } finally {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/my-tenant/api/v3/folders/my-folder/services/service-not-found/execute'),
        expect.anything() // this has been tested in the previous test.
      );
    }
  });
});
