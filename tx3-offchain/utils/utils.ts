import { Lucid, Blockfrost, Utxo, OutRef, Assets } from "@spacebudz/lucid";

import dotenv from "dotenv";

dotenv.config();

export const lucidBase = new Lucid({
  provider: new Blockfrost(
    process.env.BLOCKFROST_URL as string,
    process.env.PREPROD_BLOCKFROST_PROJECT_ID,
  ),
});

export const lucidWithWallet = lucidBase.selectWalletFromSeed(
  process.env.SEED as string,
);
