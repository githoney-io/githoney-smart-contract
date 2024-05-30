import {
  Address,
  C,
  Emulator,
  Lucid,
  OutRef,
  PrivateKey,
  fromHex
} from "lucid-cardano";
import { assignContributor, createBounty } from "../src";
import {
  ACCOUNT_ADMIN,
  ACCOUNT_CONTRIBUTOR,
  ACCOUNT_MANTAINER,
  bounty_id,
  emulator
} from "./emulatorConfig";

const cexplorerUrl = "https://preprod.cexplorer.io";

//////////////////// UTILS ////////////////////
const signAndSubmit = async (lucid: Lucid, tx: any) => {
  const txId = await lucid
    .fromTx(tx)
    .sign()
    .complete()
    .then((signedTx) => signedTx.submit());
  console.log("SUCCESS", txId);
  return txId;
};

/**
 * Waits until the utxos related to the lucid's address and the capsule address are updated by the provided tx id.
 */
async function waitForUtxosUpdate(lucid: Lucid, txId: string): Promise<void> {
  let userUtxosUpdated = false;
  let scriptUtxoUpdated = false;
  while (!userUtxosUpdated || !scriptUtxoUpdated) {
    console.debug("Waiting for utxos update...");
    await new Promise((r) => setTimeout(r, 10000));
    const utxos = await lucid.wallet.getUtxos();
    const scriptUtxos = await lucid.utxosByOutRef([
      { txHash: txId, outputIndex: 0 }
    ]);
    userUtxosUpdated = utxos.some((utxo) => utxo.txHash === txId);
    scriptUtxoUpdated = scriptUtxos.length !== 0;
  }
  // wait for 20 more seconds because sometimes it is insufficient
  await new Promise((r) => setTimeout(r, 20000));
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
  const txId = await signAndSubmit(lucid, tx);
  const { provider } = lucid;
  if (provider instanceof Emulator) {
    provider.awaitBlock(1);
  } else {
    console.debug(`${cexplorerUrl}/tx/${txId}`);
    console.debug("Waiting tx confirmation");
    await waitForUtxosUpdate(lucid, txId);
    console.debug("Utxos updated");
  }
  return txId;
}

const newBounty = async (lucid: Lucid): Promise<string> => {
  const now = new Date();
  const deadline = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1).getTime(); // Tomorrow

  const createTx = await createBounty(
    ACCOUNT_MANTAINER.address,
    ACCOUNT_ADMIN.address,
    {
      unit: "lovelace",
      amount: 100n
    },
    BigInt(deadline),
    bounty_id,
    lucid
  );
  emulator.awaitBlock(1);

  lucid.selectWalletFromSeed(ACCOUNT_MANTAINER.seedPhrase);
  const txId = await signAndSubmit(lucid, createTx);
  emulator.awaitBlock(3);
  return txId;
};

const newAssign = async (lucid: Lucid, createOutRef: OutRef) => {
  const assignTx = await assignContributor(
    createOutRef,
    ACCOUNT_CONTRIBUTOR.address,
    lucid
  );
  emulator.awaitBlock(1);

  lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
  const txId = await signAndSubmit(lucid, assignTx);
  return txId;
};

export {
  newAssign,
  newBounty,
  signAndSubmit,
  waitForUtxosUpdate,
  privateKeyToAddress,
  parseTxCBOR,
  signSubmitAndWaitConfirmation
};
