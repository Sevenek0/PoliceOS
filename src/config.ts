// Konfiguracja logowania przez Discorda.
//
// Client ID aplikacji Discord (https://discord.com/developers/applications).
// W zakładce OAuth2 tej aplikacji muszą być dodane Redirect URL:
//   http://localhost:5173/auth/discord/callback      (tryb deweloperski)
//   http://57.131.194.88:8081/auth/discord/callback  (produkcja)
//
// Logowanie działa po stronie przeglądarki (implicit grant, scope "identify") —
// nie wymaga Client Secret. Discord Secret NIGDY nie powinien trafić do kodu frontendowego.
export const DISCORD_CLIENT_ID = '1554100774156374027';

// Discord ID właściciela strony — ma pełny dostęp zawsze, bez zaproszenia.
// Serwer (API) sprawdza to samo ID niezależnie — patrz /etc/policeos-api.env.
export const OWNER_DISCORD_ID = '1255830868937670699';

// Nazwa instytucji drukowana w nagłówkach pism.
export const INSTITUTION_NAME = 'Los Santos Police Department';
export const INSTITUTION_STATE = 'Stan San Andreas';
export const INSTITUTION_CITY = 'Los Santos';
