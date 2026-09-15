export interface AuthRepository {
  requestMagicLink(email: string): Promise<void>
  signOut(): Promise<void>
}
