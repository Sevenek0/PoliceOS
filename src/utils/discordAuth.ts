import { DISCORD_CLIENT_ID } from '../config';
import type { DiscordUser } from '../types';

export function isDiscordConfigured(): boolean {
  return DISCORD_CLIENT_ID.trim().length > 0;
}

export function getDiscordRedirectUri(): string {
  return `${window.location.origin}/auth/discord/callback`;
}

export function buildDiscordAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: getDiscordRedirectUri(),
    response_type: 'token',
    scope: 'identify',
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export function parseAccessTokenFromHash(hash: string): { token: string; expiresIn: number } | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const token = params.get('access_token');
  if (!token) return null;
  // Discord implicit grant tokens live 7 days by default.
  const expiresIn = Number(params.get('expires_in')) || 604800;
  return { token, expiresIn };
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const res = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Nie udało się pobrać danych konta Discord.');
  const data = await res.json();
  const avatarUrl = data.avatar
    ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=128`
    : null;
  return {
    id: data.id,
    username: data.username,
    globalName: data.global_name ?? null,
    avatarUrl,
  };
}
