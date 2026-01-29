// src/utils/httpError.ts
import { AxiosError } from 'axios'

export function parseServerError(e: AxiosError): { code?: number; message: string } {
  const code = e?.response?.status
  let message = e?.message || '요청 실패'

  if (e?.response?.data && typeof e.response.data === 'object' && 'error' in e.response.data) {
    const errorData = e.response.data as { error?: { message?: string } };
    if (errorData.error?.message) {
      message = errorData.error.message;
    }
  } else if (e?.response?.data && typeof e.response.data === 'object' && 'message' in e.response.data) {
    const dataWithMessage = e.response.data as { message?: string };
    if (dataWithMessage.message) {
      message = dataWithMessage.message;
    }
  }

  return { code, message }
}
