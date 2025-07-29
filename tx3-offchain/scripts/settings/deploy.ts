import { deploySettings } from "../../operations/settings/deploy.ts";
import { githoneyAddr } from "../../constants.ts";
import { signAndSubmit } from "../../utils/utils.ts";

const { deployCbor, outRef } = await deploySettings(githoneyAddr);
console.log("Deploy settings transaction CBOR:", deployCbor);
console.log("Settings outRef:", outRef);

await signAndSubmit(deployCbor);
