import { deploySettings } from "../../operations/settings/deploy.ts";
import { githoneyAddr, githoneySeed } from "../../constants.ts";
import { logger, lucidBase, signAndSubmit } from "../../utils/utils.ts";

const { deployCbor, outRef } = await deploySettings(githoneyAddr);
logger.info("Settings outRef: " + JSON.stringify(outRef));
lucidBase.selectWalletFromSeed(githoneySeed);
await signAndSubmit(deployCbor);
