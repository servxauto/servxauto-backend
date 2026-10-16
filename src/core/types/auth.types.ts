/** Claims carried by an issued access token. */
export interface AuthJwtPayload {
  /** Account id. The guard looks it up in its own table to prove the account. */
  sub: string;
}
