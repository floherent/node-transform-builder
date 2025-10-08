import { Uri, StringUtils, DateUtils } from './utils.js';

describe('Uri', () => {
  const BASE_URL = 'https://excel.test.coherent.global/tenant-name';

  test('toUrl() should throw an error if params are incorrect', () => {
    expect(() => Uri.toUrl(BASE_URL, '')).toThrow();
    expect(() => Uri.toUrl(BASE_URL, 'f//')).toThrow();
    expect(() => Uri.toUrl(BASE_URL, '//s')).toThrow();
  });

  test('decode() should decode string uri into UriParams object', () => {
    // Expected cases
    expect(Uri.decode('folders/f/services/s')).toEqual({ folder: 'f', service: 's' });
    expect(Uri.decode('f/s')).toEqual({ folder: 'f', service: 's' });
    expect(Uri.decode('f/s[1.0]')).toEqual({ folder: 'f', service: 's', version: '1.0' });
    expect(Uri.decode('folders/f/services/s[1.2.3]')).toEqual({ folder: 'f', service: 's', version: '1.2.3' });
    expect(Uri.decode('version/123')).toEqual({ versionId: '123' });
    expect(Uri.decode('service/456')).toEqual({ serviceId: '456' });
    expect(Uri.decode('proxy/custom-endpoint')).toEqual({ proxy: 'custom-endpoint' });

    // Edge cases
    expect(Uri.decode('/f/s/')).toEqual({ folder: 'f', service: 's' });
    expect(Uri.decode('f/s/')).toEqual({ folder: 'f', service: 's' });
    expect(Uri.decode('///f//s//')).toEqual({ folder: 'f', service: 's' });
    expect(Uri.decode('/f/s[]/')).toEqual({ folder: 'f', service: 's' });

    // Invalid cases
    expect(Uri.decode('')).toEqual({});
    expect(Uri.decode('//f/')).toEqual({});
    expect(Uri.decode('//f')).toEqual({});
    expect(Uri.decode('///')).toEqual({});
  });

  test('encode() should encode UriParams object into string uri', () => {
    expect(Uri.encode({ folder: 'f', service: 's' })).toBe('folders/f/services/s');
    expect(Uri.encode({ folder: 'f', service: 's', version: '1.2.3' }, false)).toBe('f/s[1.2.3]');
    expect(Uri.encode({ serviceId: '456' })).toBe('service/456');
    expect(Uri.encode({ versionId: '123' })).toBe('version/123');
    expect(Uri.encode({ proxy: 'custom-endpoint' })).toBe('proxy/custom-endpoint');
  });
});

describe('StringUtils', () => {
  test('isString() should return true for string values', () => {
    expect(StringUtils.isString('hello')).toBe(true);
    expect(StringUtils.isString('')).toBe(true);
    expect(StringUtils.isString('123')).toBe(true);
    expect(StringUtils.isString(new String('hello'))).toBe(true);
    expect(StringUtils.isString(new String(''))).toBe(true);
  });

  test('isString() should return false for non-string values', () => {
    expect(StringUtils.isString(123)).toBe(false);
    expect(StringUtils.isString(null)).toBe(false);
    expect(StringUtils.isString(undefined)).toBe(false);
    expect(StringUtils.isString([])).toBe(false);
    expect(StringUtils.isString({})).toBe(false);
    expect(StringUtils.isString(true)).toBe(false);
    expect(StringUtils.isString(new Date())).toBe(false);
  });

  test('isEmpty() should return true for falsy values', () => {
    expect(StringUtils.isEmpty('')).toBe(true);
    expect(StringUtils.isEmpty('   ')).toBe(true);
    expect(StringUtils.isEmpty('\t')).toBe(true);
    expect(StringUtils.isEmpty('\n')).toBe(true);
    expect(StringUtils.isEmpty('  \t\n  ')).toBe(true);
    expect(StringUtils.isEmpty(null)).toBe(true);
    expect(StringUtils.isEmpty(undefined)).toBe(true);
    expect(StringUtils.isEmpty(0)).toBe(true);
    expect(StringUtils.isEmpty(false)).toBe(true);
    expect(StringUtils.isEmpty('hello')).toBe(false);
    expect(StringUtils.isEmpty('  text  ')).toBe(false);
    expect(StringUtils.isEmpty('0')).toBe(false);
    expect(StringUtils.isEmpty('false')).toBe(false);
    expect(StringUtils.isEmpty(123)).toBe(false);
    expect(StringUtils.isEmpty([])).toBe(false);
    expect(StringUtils.isEmpty({})).toBe(false);
    expect(StringUtils.isEmpty(new Date())).toBe(false);
  });

  test('isNotEmpty() should return false for falsy values', () => {
    expect(StringUtils.isNotEmpty(null)).toBe(false);
    expect(StringUtils.isNotEmpty(undefined)).toBe(false);
    expect(StringUtils.isNotEmpty(0)).toBe(false);
    expect(StringUtils.isNotEmpty(false)).toBe(false);
    expect(StringUtils.isNotEmpty('')).toBe(false);
    expect(StringUtils.isNotEmpty('   ')).toBe(false);
    expect(StringUtils.isNotEmpty('\t')).toBe(false);
    expect(StringUtils.isNotEmpty('\n')).toBe(false);
    expect(StringUtils.isNotEmpty('  \t\n  ')).toBe(false);
    expect(StringUtils.isNotEmpty('hello')).toBe(true);
    expect(StringUtils.isNotEmpty('  text  ')).toBe(true);
  });

  test('capitalize() should capitalize the first letter of a string', () => {
    expect(StringUtils.capitalize('hello')).toBe('Hello');
    expect(StringUtils.capitalize('world')).toBe('World');
    expect(StringUtils.capitalize('javascript')).toBe('Javascript');
    expect(StringUtils.capitalize('a')).toBe('A');
    expect(StringUtils.capitalize('z')).toBe('Z');
    expect(StringUtils.capitalize('Hello')).toBe('Hello');
    expect(StringUtils.capitalize('WORLD')).toBe('WORLD');
    expect(StringUtils.capitalize('')).toBe('');
    expect(StringUtils.capitalize('123abc')).toBe('123abc');
    expect(StringUtils.capitalize('!hello')).toBe('!hello');
    expect(StringUtils.capitalize(' hello')).toBe(' hello');
  });

  test('join() should join arrays with default comma separator', () => {
    expect(StringUtils.join(['a', 'b', 'c'])).toBe('a,b,c');
    expect(StringUtils.join(['hello', 'world'])).toBe('hello,world');
    expect(StringUtils.join(['a', 'b', 'c'], ' | ')).toBe('a | b | c');
    expect(StringUtils.join(['hello', 'world'], '-')).toBe('hello-world');
    expect(StringUtils.join(['1', '2', '3'], '')).toBe('123');
    expect(StringUtils.join([])).toBe('');
    expect(StringUtils.join([], ' | ')).toBe('');
    expect(StringUtils.join(['single'])).toBe('single');
    expect(StringUtils.join(['single'], ' | ')).toBe('single');
    expect(StringUtils.join(undefined)).toBe(undefined);
    expect(StringUtils.join(undefined, ' | ')).toBe(undefined);
  });
});

describe('DateUtils', () => {
  test('isDate() should return true for valid date values', () => {
    // Expected cases
    expect(DateUtils.isDate(new Date())).toBe(true);
    expect(DateUtils.isDate(new Date('2022-01-01'))).toBe(true);
    expect(DateUtils.isDate(new Date(2022, 0, 1))).toBe(true);
    expect(DateUtils.isDate('2022-01-01')).toBe(true);
    expect(DateUtils.isDate('01/01/2022')).toBe(true);
    expect(DateUtils.isDate('Jan 1, 2022')).toBe(true);
    expect(DateUtils.isDate('2022-12-25T10:30:00Z')).toBe(true);

    // Edge cases
    expect(DateUtils.isDate(0)).toBe(true);
    expect(DateUtils.isDate(Date.now())).toBe(true);

    // Invalid cases
    expect(DateUtils.isDate('invalid-date')).toBe(false);
    expect(DateUtils.isDate('2023-13-01')).toBe(false); // Invalid month
    expect(DateUtils.isDate('')).toBe(false);
    expect(DateUtils.isDate(null)).toBe(false);
    expect(DateUtils.isDate(undefined)).toBe(false);
    expect(DateUtils.isDate({})).toBe(false);
    expect(DateUtils.isDate([])).toBe(false);
    expect(DateUtils.isDate(true)).toBe(false);
    expect(DateUtils.isDate(NaN)).toBe(false);
  });

  test('toDate() should convert Date objects to Date', () => {
    // by date object
    const date = new Date('2023-01-01');
    expect(DateUtils.toDate(date)).toEqual(date);

    // by string
    expect(DateUtils.toDate('2022-01-01')).toEqual(new Date('2022-01-01'));
    expect(DateUtils.toDate('Jan 1, 2022')).toEqual(new Date('Jan 1, 2022'));

    // by number
    const timestamp = 1672531200000; // Jan 1, 2023
    expect(DateUtils.toDate(timestamp)).toEqual(new Date(timestamp));
    expect(DateUtils.toDate(new Date(timestamp))).toEqual(new Date(timestamp));

    // by invalid values
    expect(DateUtils.toDate('invalid-date')).toBe(undefined);
    expect(DateUtils.toDate(null)).toBe(undefined);
    expect(DateUtils.toDate(undefined)).toBe(undefined);
    expect(DateUtils.toDate({})).toBe(undefined);
    expect(DateUtils.toDate([])).toBe(undefined);
  });

  describe('parse', () => {
    test('should parse start and end dates when both are provided', () => {
      const start = '2023-01-01';
      const end = '2023-12-31';
      const [startDate, endDate] = DateUtils.parse(start, end);

      expect(startDate).toEqual(new Date(start));
      expect(endDate).toEqual(new Date(end));
    });

    test('should use current date as start when start is undefined', () => {
      const now = Date.now();
      const [startDate, endDate] = DateUtils.parse(undefined);

      expect(startDate.getTime()).toBeGreaterThanOrEqual(now);
      expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
    });

    test('should calculate end date using default years offset when end is not provided', () => {
      const start = new Date('2023-01-01');
      const [startDate, endDate] = DateUtils.parse(start);

      expect(startDate).toEqual(start);
      expect(endDate.getFullYear()).toBe(start.getFullYear() + 10); // default 10 years
    });

    test('should calculate end date using custom offset options', () => {
      const start = new Date('2023-01-01');
      const [startDate, endDate] = DateUtils.parse(start, undefined, { years: 5, months: 6, days: 15 });

      expect(startDate).toEqual(start);
      expect(endDate.getFullYear()).toBe(2028); // 2023 + 5
      expect(endDate.getMonth()).toBe(6); // January (0) + 6 = July (6)
      expect(endDate.getDate()).toBe(16); // 1 + 15
    });

    test('should use start date as base for end date calculation when end is before start', () => {
      const start = new Date('2023-06-15');
      const end = new Date('2023-01-01'); // Before start
      const [startDate, endDate] = DateUtils.parse(start, end);

      expect(startDate).toEqual(start);
      expect(endDate.getFullYear()).toBe(start.getFullYear() + 10); // Calculated from start
    });

    test('should handle string and number inputs', () => {
      const start = '2023-01-01';
      const end = 1703980800000; // Dec 31, 2023 timestamp
      const [startDate, endDate] = DateUtils.parse(start, end);

      expect(startDate).toEqual(new Date(start));
      expect(endDate).toEqual(new Date(end));
    });
  });

  describe('isAfter', () => {
    test('should return true when date is after the comparison date', () => {
      const when = new Date('2023-01-01');
      expect(DateUtils.isAfter('2023-01-02', when)).toBe(true);
      expect(DateUtils.isAfter(new Date('2023-01-02'), when)).toBe(true);
      expect(DateUtils.isAfter(new Date('2023-01-01').getTime() + 1000, when)).toBe(true);
    });

    test('should return false when date is before the comparison date', () => {
      const when = new Date('2023-01-01');
      expect(DateUtils.isAfter('2022-12-31', when)).toBe(false);
      expect(DateUtils.isAfter(new Date('2022-12-31'), when)).toBe(false);
      expect(DateUtils.isAfter(new Date('2023-01-01').getTime() - 1000, when)).toBe(false);
    });

    test('should return false when dates are equal', () => {
      const when = new Date('2023-01-01');
      expect(DateUtils.isAfter('2023-01-01', when)).toBe(false);
      expect(DateUtils.isAfter(new Date('2023-01-01'), when)).toBe(false);
      expect(DateUtils.isAfter(when.getTime(), when)).toBe(false);
    });

    test('should handle different date formats', () => {
      const when = new Date('2023-01-01T12:00:00Z');
      expect(DateUtils.isAfter('Jan 1, 2023 1:00 PM', when)).toBe(true);
      // Note: Date parsing can vary by timezone and locale, so let's use a clearer example
      expect(DateUtils.isAfter('2023-01-01T10:00:00Z', when)).toBe(false);
    });
  });
});
