import { Lucid } from "lucid-cardano";
import { ACCOUNT_0, ACCOUNT_MANTAINER, emulator } from "./emulatorConfig";

const signAndSubmitCreate = async (lucid: Lucid, tx: any) => {
  emulator.awaitBlock(1);

  lucid.selectWalletFromSeed(ACCOUNT_MANTAINER.seedPhrase);
  const createTxId = await lucid
    .fromTx(tx)
    .sign()
    .complete()
    .then((signedTx) => signedTx.submit());
  console.log("SUCCESS CREATE BOUNTY", createTxId);
  return { createTxId };
};

const signAndSubmitAddRewards = async (lucid: Lucid, tx: any) => {
  emulator.awaitBlock(1);

  lucid.selectWalletFromSeed(ACCOUNT_0.seedPhrase);
  const addRewardsTxId = await lucid
    .fromTx(tx)
    .sign()
    .complete()
    .then((signedTx) => signedTx.submit());
  console.log("SUCCESS ADD REWARDS", addRewardsTxId);
  return { addRewardsTxId };
};

export { signAndSubmitCreate, signAndSubmitAddRewards };
