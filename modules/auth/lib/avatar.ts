export function getAvatarUrl(username: string) {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(username)}`;
}
