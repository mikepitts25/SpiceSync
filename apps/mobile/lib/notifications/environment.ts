export function shouldInitializeNotificationsOnLaunch(
  appOwnership: string | null | undefined
): boolean {
  return appOwnership !== 'expo';
}
