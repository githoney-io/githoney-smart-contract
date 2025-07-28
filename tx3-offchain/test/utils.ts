import { Lucid, OutRef, Utxo } from "@spacebudz/lucid";
import {
  assignContributor,
  claimBounty,
  closeBounty,
  createBounty,
  mergeBounty,
} from "../operations/index.ts";
import Logger from "@ptkdev/logger";
import {
  adminAddr,
  adminSeed,
  contributorAddr,
  contributorSeed,
  githoneyAddr,
  maintainerAddr,
  maintainerSeed,
} from "../constants.ts";
import { lucidBase, signAndSubmit } from "../utils/utils.ts";

export const logger = new Logger();

export const rewardPolicy =
  "fb279c09175731ade05f7314a9b36cf923c7a3d6873be26bbd1eeccf";
export const rewardName = "tokenD";
export const rewardAmount = 1_000n;
export const bountyId = "bountyTX3";

/**
 * Waits until the utxos related to the lucid's address and the capsule address are updated by the provided tx id.
 */

async function waitForUtxosUpdate(lucid: Lucid, txId: string): Promise<void> {
  let userUtxosUpdated = false;
  let scriptUtxoUpdated = false;
  while (!userUtxosUpdated || !scriptUtxoUpdated) {
    console.info("Waiting for utxos update...");
    await new Promise((r) => setTimeout(r, 10000));
    const utxos = await lucid.wallet.getUtxos();
    const scriptUtxos = await lucid.utxosByOutRef([
      { txHash: txId, outputIndex: 0 },
    ]);
    userUtxosUpdated = utxos.some((utxo) => utxo.txHash === txId);
    scriptUtxoUpdated = scriptUtxos.length !== 0;
  }
  // wait for 20 more seconds because sometimes it is insufficient
  await new Promise((r) => setTimeout(r, 20000));
}

async function outRefWithErrorCatching(
  outRef: OutRef,
  lucid: Lucid,
): Promise<Utxo> {
  let i = 0;
  let outRefUtxo;
  while (!outRefUtxo) {
    try {
      [outRefUtxo] = await lucid.utxosByOutRef([outRef]);
    } catch (e: any) {
      i++;
      logger.error(e.message);
      // await new Promise((r) => setTimeout(r, 5000));
      if (i > 15) {
        throw new Error("OutRef not found, max attempts reached");
      }
    }
  }
  return outRefUtxo;
}

const newBounty = async (lucid: Lucid, settingsUtxo: Utxo) => {
  const now = new Date();
  const deadline = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2).getTime();

  const { createCbor } = await createBounty(
    githoneyAddr,
    rewardPolicy,
    rewardName,
    rewardAmount,
    bountyId,
    maintainerAddr,
    adminAddr,
    settingsUtxo,
    BigInt(deadline),
  );
  console.log("Create transaction CBOR:", createCbor);
  lucid.selectWalletFromSeed(maintainerSeed);
  const txId = await signAndSubmit(createCbor, lucid);
  waitForUtxosUpdate(lucidBase, txId);
  return txId;
};

const newAssign = async (lucid: Lucid, outRef: OutRef, settingsUtxo: Utxo) => {
  const { assignCbor } = await assignContributor(
    contributorAddr,
    settingsUtxo,
    outRef,
  );
  console.log("Assign transaction CBOR:", assignCbor);
  lucid.selectWalletFromSeed(contributorSeed);
  const txId = await signAndSubmit(assignCbor, lucid);
  waitForUtxosUpdate(lucid, txId);
  return txId;
};

const newMerge = async (lucid: Lucid, outRef: OutRef, settingsUtxo: Utxo) => {
  const { mergeCbor } = await mergeBounty(adminAddr, settingsUtxo, outRef);
  console.log("Merge transaction CBOR:", mergeCbor);
  lucid.selectWalletFromSeed(adminSeed);
  const txId = await signAndSubmit(mergeCbor, lucid);
  waitForUtxosUpdate(lucid, txId);
  return txId;
};

const newClaim = async (lucid: Lucid, outRef: OutRef, settingsUtxo: Utxo) => {
  const { claimCbor } = await claimBounty(settingsUtxo, outRef);
  console.log("Claim transaction CBOR:", claimCbor);
  lucid.selectWalletFromSeed(contributorSeed);
  const txId = await signAndSubmit(claimCbor, lucid);
  waitForUtxosUpdate(lucid, txId);
  return txId;
};

const newClose = async (lucid: Lucid, outRef: OutRef, settingsUtxo: Utxo) => {
  const { closeCbor } = await closeBounty(adminAddr, {}, settingsUtxo, outRef);
  console.log("Close transaction CBOR:", closeCbor);
  lucid.selectWalletFromSeed(adminSeed);
  const txId = await signAndSubmit(closeCbor, lucid);
  waitForUtxosUpdate(lucid, txId);
  return txId;
};

export {
  newAssign,
  newBounty,
  newClaim,
  newClose,
  newMerge,
  outRefWithErrorCatching,
  waitForUtxosUpdate,
};
