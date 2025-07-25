import { deploySettings } from "../../operations/settings/deploy";
import { githoneyAddr } from "../../constants";
import { signAndSubmit } from "../../utils/utils";

const { deployCbor, outRef } = await deploySettings(githoneyAddr);
console.log("Deploy settings transaction CBOR:", deployCbor);
console.log("Settings outRef:", outRef);

await signAndSubmit(deployCbor);
