import "express-session";

declare module "express-session" {
  interface SessionData {
    isLoggedIn: boolean;
    username: string;
    admin: boolean;
  }
}

export type SecretFile = {
  name: string;
  type: string;
  data: string;
};

export type SecretData = {
  id: string;
  message: string;
  controlmessage: string;
  burnsAfterXOpens: number;
  opens: number;
  owner: string | null;
  file: SecretFile | null;
};
