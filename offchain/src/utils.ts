import { Lucid } from "lucid-cardano";

interface NetConfig {
  SIGN_SERVER_URL: string;
  SEED: string;
  MARLOWE_RT_WEBSERVER_URL: string;
  BLOCKFROST_PROJECT_ID: string;
  BLOCKFROST_URL: string;
  lucidAdmin: Lucid | null;
}

const Roles = {
  MAINTAINER: "Maintainer",
  GIT_HONEY: "GitHoney",
  ADMIN: "Admin",
  CONTRIBUTOR: "Contributor"
};

const MIN_ADA = 2_000_000n;

export { MIN_ADA, Roles, NetConfig };
