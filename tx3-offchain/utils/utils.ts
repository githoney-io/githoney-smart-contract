import { Lucid, Blockfrost } from "@spacebudz/lucid";

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

export const cExplorerTxURL = "https://preprod.cexplorer.io/tx/";

export const signAndSubmit = async (cbor: string): Promise<string> => {
  lucidBase.selectWalletFromSeed(process.env.SEED as string);
  const tx = await lucidWithWallet.fromTx(cbor);
  const signedTx = await tx.sign().commit();
  const txHash = await signedTx.submit();
  console.log("Submitted transaction. View it at: " + cExplorerTxURL + txHash);

  return txHash;
};
