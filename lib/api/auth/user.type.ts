export interface ApiUser {
  id: string;
  username: string;
  displayName: string;
}

export interface ClientUser extends ApiUser {
  keyEncryptionKey: CryptoKey;
}
