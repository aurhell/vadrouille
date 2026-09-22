export type AuthRepository = {
  requestMagicLink(email: string): Promise<void>
  signOut(): Promise<void>
}
