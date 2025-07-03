import { githoneyAddr } from "../constants";
import { createBounty } from "../operations/create";
import { lucidWithWallet } from "../utils/utils";

const { createCbor } = await createBounty();
console.log("Create transaction CBOR:", createCbor);

const sign = await lucidWithWallet.fromTx(createCbor);
const signedTx = await sign.sign().commit();
const submit = await signedTx.submit();
console.log("Transaction submitted:", submit);
