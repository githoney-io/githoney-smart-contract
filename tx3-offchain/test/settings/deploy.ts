import { deploySettings } from "../../operations/settings/deploy";
import { githoneyAddr } from "../../constants";
import { signAndSubmit } from "../../utils/utils";

const { deployCbor } = await deploySettings(githoneyAddr);
console.log("Deploy settings transaction CBOR:", deployCbor);

await signAndSubmit(deployCbor);
