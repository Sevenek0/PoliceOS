import { getValidDiscordToken } from '../store/useDiscordAuth';

export class ApiError extends Error {
  /** True when the Discord session is missing/expired and the user has to log in again. */
  readonly needsLogin: boolean;
  readonly status: number;
  constructor(message: string, needsLogin = false, status = 0) {
    super(message);
    this.needsLogin = needsLogin;
    this.status = status;
  }
}

/** POSTs an action to the PoliceOS API, authenticated with the Discord token. */
export async function apiCall<T>(endpoint: 'documents' | 'access' | 'mdt', payload: Record<string, unknown>): Promise<T> {
  const token = getValidDiscordToken();
  if (!token) throw new ApiError('Sesja Discord wygasła — zaloguj się ponownie.', true, 401);

  let res: Response;
  try {
    res = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-discord-token': token },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError('Brak połączenia z serwerem.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error ?? `Błąd serwera (${res.status}).`, res.status === 401, res.status);
  }
  return data as T;
}

