import { githoneyAddr } from "../constants";
import { deploySettings } from "../operations/settings/deploy";
import { lucidWithWallet } from "../utils/utils";

const { deployCbor } = await deploySettings(githoneyAddr);
console.log("Deploy transaction CBOR:", deployCbor);
