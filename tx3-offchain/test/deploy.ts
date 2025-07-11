import { deploySettings } from "../../offchain/src";
import { githoneyAddr } from "../constants";
import { lucidWithWallet, signAndSubmit } from "../utils/utils";

const { cbor, outRef } = await deploySettings(githoneyAddr, lucidWithWallet);
await signAndSubmit(cbor);
console.log("Settings deployed successfully.");
console.log("Output reference:", outRef);
