export function extractAxiosErrorMessage(error: unknown, fallback: string): string {
  const err = error as {
    response?: {
      data?: any;
      status?: number;
    };
    message?: string;
  };

  const data = err?.response?.data;

  let message: string | undefined;

  if (typeof data === 'string' && data.trim()) {
    message = data.trim();
  } else if (data && typeof data === 'object') {
    if (typeof data.message === 'string' && data.message.trim()) {
      message = data.message.trim();
    } else if (typeof (data as any).error === 'string' && (data as any).error.trim()) {
      message = (data as any).error.trim();
    } else if ((data as any).error && typeof (data as any).error === 'object') {
      const nestedError = (data as any).error;
      if (typeof nestedError.message === 'string' && nestedError.message.trim()) {
        message = nestedError.message.trim();
      }
    }
  }

  if (message) return message;
  if (err?.message) return err.message;
  if (error instanceof Error && error.message) return error.message;

  return fallback;
}

