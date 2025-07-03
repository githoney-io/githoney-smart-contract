import { githoneyAddr } from "../constants";
import { deploySettings } from "../operations/settings/deploy";
import { lucidWithWallet } from "../utils/utils";

const { deployCbor } = await deploySettings(githoneyAddr);
console.log("Deploy transaction CBOR:", deployCbor);

const sign = await lucidWithWallet.fromTx(deployCbor);
const signedTx = await sign.sign().commit();
const submit = await signedTx.submit();
console.log("Transaction submitted:", submit);
