import { closeSettings } from "../../operations/settings/close.ts";
import { githoneySeed, settingsNftRef, settingsRef } from "../../constants.ts";
import { lucidBase, signAndSubmit } from "../../utils/utils.ts";

const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);

const { closeCbor } = await closeSettings(settingsUtxo, settingsNftRef);
lucidBase.selectWalletFromSeed(githoneySeed);
await signAndSubmit(closeCbor);
