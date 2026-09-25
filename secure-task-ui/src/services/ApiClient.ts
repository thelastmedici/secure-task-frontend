import type { InviteUserInput, UpdateUserInput, User } from '../types';

type ApiOptions = {
  method: 'POST' | 'PATCH';
  body?: unknown;
  accessToken?: string | null;
};

type ApiUser = Partial<User> & { id?: string; user?: Partial<User> };

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async inviteUser(input: InviteUserInput, accessToken?: string | null): Promise<ApiUser | null> {
    return this.request<ApiUser>('/users/invitations', { method: 'POST', body: input, accessToken });
  }

  async updateUser(id: string, input: UpdateUserInput, accessToken?: string | null): Promise<ApiUser | null> {
    return this.request<ApiUser>(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: input, accessToken });
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.request('/auth/password-reset-requests', { method: 'POST', body: { email } });
  }

  private async request<T>(path: string, options: ApiOptions): Promise<T | null> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: options.method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        credentials: 'include',
      });
    } catch {
      throw new ApiError('Unable to reach the service. Please try again.');
    }

    const payload = await this.readPayload(response);
    if (!response.ok) {
      const message = this.getErrorMessage(payload) ?? 'The request could not be completed.';
      throw new ApiError(message, response.status);
    }
    return payload as T | null;
  }

  private async readPayload(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) return null;
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private getErrorMessage(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') return null;
    const value = payload as { message?: unknown; error?: { message?: unknown } };
    if (typeof value.message === 'string') return value.message;
    return typeof value.error?.message === 'string' ? value.error.message : null;
  }
}
