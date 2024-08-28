import {
  Address,
  C,
  Emulator,
  Lucid,
  OutRef,
  PrivateKey,
  UTxO,
  fromHex
} from "lucid-txpipe";
import {
  assignContributor,
  claimBounty,
  closeBounty,
  createBounty,
  deploySettings,
  mergeBounty
} from "../src";
import {
  ACCOUNT_ADMIN,
  ACCOUNT_CONTRIBUTOR,
  ACCOUNT_GITHONEY,
  ACCOUNT_MANTAINER,
  bounty_id,
  emulator,
  tokenAUnit
} from "./emulatorConfig";
import logger from "../src/logger";
import { githoneyAddr } from "../src/constants";

const cexplorerUrl = "https://preprod.cexplorer.io";

/**
 * Waits until the utxos related to the lucid's address and the capsule address are updated by the provided tx id.
 */
async function waitForUtxosUpdate(lucid: Lucid, txId: string): Promise<void> {
  let userUtxosUpdated = false;
  let scriptUtxoUpdated = false;
  while (!userUtxosUpdated || !scriptUtxoUpdated) {
    try {
      logger.info("Waiting for utxos update...");
      await new Promise((r) => setTimeout(r, 10000));
      const utxos = await lucid.wallet.getUtxos();
      const scriptUtxos = await lucid.utxosByOutRef([
        { txHash: txId, outputIndex: 0 }
      ]);
      userUtxosUpdated = utxos.some((utxo) => utxo.txHash === txId);
      scriptUtxoUpdated = scriptUtxos.length !== 0;
    } catch (e) {
      logger.error(e);
    }
  }
  // wait for 20 more seconds because sometimes it is insufficient
  await new Promise((r) => setTimeout(r, 20000));
}

async function outRefWithErrorCatching(
  outRef: OutRef,
  lucid: Lucid
): Promise<UTxO> {
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

function privateKeyToAddress(privateKey: PrivateKey): Address {
  const priv = C.PrivateKey.from_bech32(privateKey);
  const pubKeyHash = priv.to_public().hash();
  return C.EnterpriseAddress.new(
    0, // for testnets only
    C.StakeCredential.from_keyhash(pubKeyHash)
  )
    .to_address()
    .to_bech32(undefined);
}

function parseTxCBOR(tx: string): C.Transaction {
  return C.Transaction.from_bytes(fromHex(tx));
}

/**
 * Sign tx with the given private keys, submits it and waits for confirmation i.e. it is in the blockchain.
 */
async function signSubmitAndWaitConfirmation(
  lucid: Lucid,
  tx: string
): Promise<string> {
  let txId;
  while (!txId) {
    try {
      txId = await signAndSubmit(lucid, tx);
    } catch (e: any) {
      logger.error(e.message);
    }
  }
  const { provider } = lucid;
  if (provider instanceof Emulator) {
    provider.awaitBlock(1);
  } else {
    logger.info(`${cexplorerUrl}/tx/${txId}`);
    logger.info("Waiting tx confirmation");
    await waitForUtxosUpdate(lucid, txId);
    logger.info("Utxos updated");
  }
  return txId;
}

const signAndSubmit = async (lucid: Lucid, tx: any) => {
  const txId = await lucid
    .fromTx(tx)
    .sign()
    .complete()
    .then((signedTx) => signedTx.submit());
  emulator.awaitBlock(3);
  console.log("SUCCESS, TxId:", txId);
  return txId;
};

const newBounty = async (lucid: Lucid, settingsUtxo: UTxO) => {
  const now = new Date();
  const deadline = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2).getTime(); // 2 days from now

  const createTxId = await createBounty(
    settingsUtxo,
    ACCOUNT_MANTAINER.address,
    ACCOUNT_ADMIN.address,
    { [tokenAUnit]: 1_000n },
    BigInt(deadline),
    bounty_id,
    lucid
  );
  emulator.awaitBlock(3);

  lucid.selectWalletFromSeed(ACCOUNT_MANTAINER.seedPhrase);
  const txId = await signAndSubmit(lucid, createTxId);
  return txId;
};

const newAssign = async (lucid: Lucid, outRef: OutRef, settingsUtxo: UTxO) => {
  const assignTx = await assignContributor(
    settingsUtxo,
    outRef,
    ACCOUNT_CONTRIBUTOR.address,
    lucid
  );
  emulator.awaitBlock(3);

  lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
  const txId = await signAndSubmit(lucid, assignTx);
  return txId;
};

const newMerge = async (lucid: Lucid, outRef: OutRef, settingsUtxo: UTxO) => {
  const mergeTx = await mergeBounty(settingsUtxo, outRef, lucid);
  emulator.awaitBlock(3);
  lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
  const txId = await signAndSubmit(lucid, mergeTx);
  return txId;
};

const newClaim = async (lucid: Lucid, outRef: OutRef, settingsUtxo: UTxO) => {
  const claimTx = await claimBounty(settingsUtxo, outRef, lucid);
  emulator.awaitBlock(3);
  lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
  const txId = await signAndSubmit(lucid, claimTx);
  return txId;
};

const newClose = async (lucid: Lucid, outRef: OutRef, settingsUtxo: UTxO) => {
  const closeTx = await closeBounty(settingsUtxo, outRef, {}, lucid);
  emulator.awaitBlock(3);
  lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
  const txId = await signAndSubmit(lucid, closeTx);
  return txId;
};

const deployUtxo = async (lucid: Lucid) => {
  const { cbor, outRef } = await deploySettings(githoneyAddr, lucid);
  lucid.selectWalletFromSeed(ACCOUNT_GITHONEY.seedPhrase);
  const deployTxId = await signAndSubmit(lucid, cbor);
  const [settingsUtxo] = await lucid.utxosByOutRef([
    { txHash: deployTxId, outputIndex: 0 }
  ]);
  return { settingsUtxo, outRef };
};

export {
  newAssign,
  newBounty,
  newMerge,
  newClaim,
  newClose,
  deployUtxo,
  signAndSubmit,
  waitForUtxosUpdate,
  privateKeyToAddress,
  parseTxCBOR,
  outRefWithErrorCatching,
  signSubmitAndWaitConfirmation
};
