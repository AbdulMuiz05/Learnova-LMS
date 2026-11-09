interface ApiErrorBody {
  success?: boolean;
  message?: string;
  code?: string;
  errors?: unknown;
}

interface NormalizedError {
  status?: number | string;
  data?: ApiErrorBody;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error || typeof error !== 'object') return fallback;

  const candidate = error as NormalizedError & { message?: string };
  const data = candidate.data;

  if (data?.message) {
    if (Array.isArray(data.errors)) {
      const first = data.errors[0] as { field?: string; message?: string } | undefined;
      if (first?.message) {
        return first.field ? `${data.message} (${first.field}: ${first.message})` : first.message;
      }
    }
    return data.message;
  }

  if (candidate.status === 'FETCH_ERROR') {
    return 'Cannot reach the API server. Make sure the backend is running and NEXT_PUBLIC_API_URL is correct.';
  }
  if (candidate.status === 'TIMEOUT_ERROR') {
    return 'The request timed out. Please try again.';
  }
  if (typeof candidate.status === 'number' && candidate.status >= 500) {
    return 'The server ran into a problem. Please try again in a moment.';
  }
  if (typeof candidate.message === 'string' && candidate.message) {
    return candidate.message;
  }
  return fallback;
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as NormalizedError;
  return candidate.data?.code;
}
