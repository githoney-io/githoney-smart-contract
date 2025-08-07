import { Lucid, OutRef, Utxo } from "@spacebudz/lucid";
import {
  assignContributor,
  claimBounty,
  closeBounty,
  createBounty,
  mergeBounty,
} from "../operations/index.ts";
import {
  adminAddr,
  adminSeed,
  contributorAddr,
  contributorSeed,
  maintainerAddr,
  maintainerSeed,
} from "../constants.ts";
import { logger, signAndSubmit } from "../utils/utils.ts";

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
      if (i > 15) {
        throw new Error("OutRef not found, max attempts reached");
      }
    }
  }
  return outRefUtxo;
}

/**
 * Sign tx with the given private keys, submits it and waits for confirmation i.e. it is in the blockchain.
 */
async function signSubmitAndWaitConfirmation(
  tx: string,
  lucid: Lucid,
): Promise<string> {
  let txId;
  let attempts = 0;
  const maxAttempts = 5;

  while (!txId && attempts < maxAttempts) {
    try {
      txId = await signAndSubmit(tx, lucid);
    } catch (e: any) {
      const error = e as Error;
      logger.error(`Attempt ${attempts + 1}: ${error.message}`);
      attempts++;

      if (attempts >= maxAttempts) {
        break;
      }
    }
  }

  if (!txId) {
    throw new Error(
      `Failed to sign and submit transaction after ${maxAttempts} attempts.`,
    );
  }

  logger.info("Waiting tx confirmation...");
  await waitForUtxosUpdate(lucid, txId);
  logger.info("Utxos updated!");

  return txId;
}

const newBounty = async (lucid: Lucid, settingsUtxo: Utxo) => {
  const now = new Date();
  const deadline = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2).getTime();

  const { createCbor } = await createBounty(
    rewardPolicy,
    rewardName,
    rewardAmount,
    bountyId,
    maintainerAddr,
    adminAddr,
    settingsUtxo,
    BigInt(deadline),
  );
  lucid.selectWalletFromSeed(maintainerSeed);
  const txId = await signAndSubmit(createCbor, lucid);
  await waitForUtxosUpdate(lucid, txId);
  return txId;
};

const newAssign = async (lucid: Lucid, outRef: OutRef, settingsUtxo: Utxo) => {
  const { assignCbor } = await assignContributor(
    contributorAddr,
    settingsUtxo,
    outRef,
  );
  lucid.selectWalletFromSeed(contributorSeed);
  const txId = await signAndSubmit(assignCbor, lucid);
  await waitForUtxosUpdate(lucid, txId);
  return txId;
};

const newMerge = async (lucid: Lucid, outRef: OutRef, settingsUtxo: Utxo) => {
  const { mergeCbor } = await mergeBounty(adminAddr, settingsUtxo, outRef);
  lucid.selectWalletFromSeed(adminSeed);
  const txId = await signAndSubmit(mergeCbor, lucid);
  await waitForUtxosUpdate(lucid, txId);
  return txId;
};

const newClaim = async (lucid: Lucid, outRef: OutRef, settingsUtxo: Utxo) => {
  const { claimCbor } = await claimBounty(settingsUtxo, outRef);
  lucid.selectWalletFromSeed(contributorSeed);
  const txId = await signAndSubmit(claimCbor, lucid);
  await waitForUtxosUpdate(lucid, txId);
  return txId;
};

const newClose = async (
  lucid: Lucid,
  outRef: OutRef,
  settingsUtxo: Utxo,
  refundings = {},
) => {
  const { closeCbor } = await closeBounty(
    adminAddr,
    refundings,
    settingsUtxo,
    outRef,
  );
  lucid.selectWalletFromSeed(adminSeed);
  const txId = await signAndSubmit(closeCbor, lucid);
  await waitForUtxosUpdate(lucid, txId);
  return txId;
};

export {
  newAssign,
  newBounty,
  newClaim,
  newClose,
  newMerge,
  signSubmitAndWaitConfirmation,
  outRefWithErrorCatching,
  waitForUtxosUpdate,
};
