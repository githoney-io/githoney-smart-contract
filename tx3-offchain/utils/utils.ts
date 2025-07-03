import { Lucid, Blockfrost, Utxo, OutRef, Assets } from "@spacebudz/lucid";
import { SLOT_CONFIG_NETWORK } from "@blaze-cardano/core";

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

// TODO - Use lucid instead

export const toPreviewBlockSlot = (timestamp: number): number => {
  const zeroTime = SLOT_CONFIG_NETWORK.Preprod.zeroTime;
  const slotLength = SLOT_CONFIG_NETWORK.Preprod.slotLength;
  return Math.floor((timestamp - zeroTime) / slotLength);
};
