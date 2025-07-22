import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, OutRef, Utxo } from "@spacebudz/lucid";
import { lucidBase, lucidWithWallet } from "../../utils/utils.ts";
import { collateralOutRef } from "../../utils/utxo.ts";
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

  const [selectedUtxos] = await collateralOutRef(lucidWithWallet);
  const collateralref = selectedUtxos.txHash + "#" + selectedUtxos.outputIndex;

  const [bountyUtxo] = await lucidBase.utxosByOutRef([utxoRef]);
  const bountyRef = bountyUtxo.txHash + "#" + bountyUtxo.outputIndex;

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

  const now = new Date().getTime() - 60 * 1000;
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();

  const { tx } = await protocol.assignTx({
    bountyref: {
      value: bountyRef,
      type: "String",
    },
    collateralref: { value: collateralref, type: "String" },
    contributor: { value: contributorAddr, type: "String" },
    contributorpaymentcredential: {
      value: Buffer.from(contributorPaymentCred!, "hex"),
      type: "Bytes",
    },
    contributorstakecredential: {
      value: Buffer.from(contributorStakeCred!, "hex"),
      type: "Bytes",
    },
    minada: { value: BigInt(MIN_ADA), type: "Int" },
    script: { value: scriptAddress, type: "String" },
    settingsref: {
      value: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
      type: "String",
    },
    since: { value: BigInt(lucidBase.utils.unixTimeToSlots(now)), type: "Int" },
    until: {
      value: BigInt(lucidBase.utils.unixTimeToSlots(sixHoursFromNow)),
      type: "Int",
    },
  });

  return {
    assignCbor: tx,
  };
}

export { assignContributor };
