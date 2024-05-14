import Cookies from 'js-cookie';

export const isNotDefined = <T>(value: T | undefined | null): value is undefined | null => value === undefined || value === null;

export const isDefined = <T>(value: T | undefined | null): value is NonNullable<T> => value !== undefined && value !== null;

export const isEmpty = (value: string | undefined | null): value is undefined => value === undefined || value === null || value === '';

export const isNotEmpty = (value: string | undefined | null): value is string => value !== undefined && value !== null && value !== '';

export const sendRequest = async <ResponseData>(
  params:
    | {
        url: string;
        method: string;
        body?: Record<string, unknown> | FormData;
        type?: string;
        authToken?: string;
        contentType?: string;
      }
    | string,
): Promise<{ data?: ResponseData; error?: Error }> => {
  try {
    const url = typeof params === 'string' ? params : params.url;
    const authToken = Cookies.get('jwt');
    const response = await fetch(url, {
      method: typeof params === 'string' ? 'GET' : params.method,
      mode: 'cors',
      headers:
        typeof params !== 'string' && isDefined(params.body)
          ? {
              Authorization: `Bearer ${authToken}`,
            }
          : undefined,
      body: typeof params !== 'string' && isDefined(params.body) ? (params.body as FormData) : undefined,
    });
    let data: any;
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (typeof params !== 'string' && params.type === 'blob') {
      data = await response.blob();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let errorMessage;

      if (typeof data === 'object' && 'error' in data) {
        errorMessage = data.error;
      } else {
        errorMessage = data || response.statusText;
      }

      throw errorMessage;
    }
    return { data };
  } catch (e) {
    console.error(e);
    return { error: e as Error };
  }
};
