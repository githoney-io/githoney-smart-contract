import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, paymentCredentialOf } from "@spacebudz/lucid";
import { creationFee, rewardFee, settingsTokenName } from "../../constants.ts";
import { GithoneyContractSettingsSpend } from "../../plutus.ts";
import { lucidBase, lucidWithWallet } from "../../utils/utils.ts";
import { selectUTxOs, sortUTxOs } from "../../utils/utxo.ts";

async function deploySettings(githoneyAddr: string): Promise<{
  deployCbor: string;
}> {
  const script = new GithoneyContractSettingsSpend();
  const scriptAddress = lucidBase.utils.scriptToAddress(script);
  const policyId = paymentCredentialOf(scriptAddress).hash;

  const selectedUtxos = await lucidWithWallet.wallet
    .getUtxos()
    .then((utxos) => selectUTxOs(utxos, { lovelace: 10_000_000n }))
    .then((utxos) => sortUTxOs(utxos, "Canonical"));

  const collateralref =
    selectedUtxos[0].txHash + "#" + selectedUtxos[0].outputIndex;

  const { tx } = await protocol.deployTx({
    script: scriptAddress,
    githoneyaddr: Addresses.inspect(githoneyAddr).address,
    bountycreationfee: Number(creationFee),
    bountyrewardfee: Number(rewardFee),
    settingspolicyid: Buffer.from(policyId, "hex"),
    settingstokenname: Buffer.from(settingsTokenName), // fromText(settingsTokenName)
    collateralref: collateralref,
  });

  return {
    deployCbor: tx,
  };
}

export { deploySettings };
