import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, OutRef, Utxo } from "@spacebudz/lucid";
import { lucidBase, lucidWithWallet } from "../../utils/utils.ts";
import { sortUTxOs } from "../../utils/utxo.ts";
import { MIN_ADA } from "../../constants.ts";
import { GithoneyContractGithoneySpend } from "../../plutus.ts";

async function assignContributor(
  contributorAddr: string,
  settingsUtxo: Utxo,
  utxoRef: OutRef,
): Promise<{
  assignCbor: string;
}> {
  const scriptAddress = lucidBase.utils.scriptToAddress(
    settingsUtxo.scriptRef!,
  );
  const scriptHash = Addresses.scriptToCredential(settingsUtxo.scriptRef!).hash;
  console.log("scriptHash:", scriptHash);

  const selectedUtxos = await lucidWithWallet.wallet
    .getUtxos()
    .then((utxos) => {
      console.log("Selected UTXOs:", utxos);
      return utxos.filter(
        (utxo) =>
          utxo.assets["lovelace"] >= 5_000_000 &&
          Object.keys(utxo.assets).length === 1,
      );
    })
    .then((utxos) => sortUTxOs(utxos, "Canonical"));

  const collateralref =
    selectedUtxos[0].txHash + "#" + selectedUtxos[0].outputIndex;

  const [bountyUtxo] = await lucidBase.utxosByOutRef([utxoRef]);

  const oldDatum = await lucidBase.datumOf(
    bountyUtxo,
    GithoneyContractGithoneySpend.datum,
  );

  if (oldDatum.merged) {
    throw new Error("Bounty already merged");
  }
  if (oldDatum.deadline < Date.now()) {
    throw new Error("Bounty deadline passed");
  }
  if (oldDatum.contributorAddress) {
    throw new Error("Bounty already has a contributor");
  }

  const contributorPaymentCred =
    Addresses.inspect(contributorAddr).payment?.hash;
  const contributorStakeCred =
    Addresses.inspect(contributorAddr).delegation?.hash || null;

  const now = new Date().getTime() - 60;
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();

  const { tx } = await protocol.assignTx({
    bountyref: `${bountyUtxo.txHash}#${bountyUtxo.outputIndex}`,
    collateralref: collateralref,
    contributor: contributorAddr,
    contributorpaymentcredential: Buffer.from(contributorPaymentCred!, "hex"),
    contributorstakecredential: Buffer.from(contributorStakeCred!, "hex"),
    minada: Number(MIN_ADA),
    script: scriptAddress,
    settingsref: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
    since: lucidBase.utils.unixTimeToSlots(now),
    until: lucidBase.utils.unixTimeToSlots(sixHoursFromNow),
  });

  return {
    assignCbor: tx,
  };
}

export { assignContributor };
