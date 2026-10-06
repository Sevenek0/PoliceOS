import { useOfficerProfile } from './useOfficerProfile';
import { useDiscordAuth } from './useDiscordAuth';
import { useDiscordProfiles } from './useDiscordProfiles';

// Side-effect module: keep the logged-in Discord account's profile snapshot
// up to date so it can be restored on the next Discord login. Imported once
// for its side effect (see main.tsx).
useOfficerProfile.subscribe((state) => {
  const discordUser = useDiscordAuth.getState().user;
  if (!discordUser) return;
  const { update: _update, ...snapshot } = state;
  useDiscordProfiles.getState().save(discordUser.id, snapshot);
});
