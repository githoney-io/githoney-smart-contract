import { githoneyValidator } from "../../scripts";
import { Lucid, OutRef } from "lucid-cardano";
import {
  GithoneyDatum,
  GithoneyDatumT,
  GithoneyValidatorRedeemer
} from "../../types";
import { validatorParams } from "../../utils";
import logger from "../../logger";

async function deploy(lucid: Lucid, address: string) {
  logger.info("START deploy");
  const scriptParams = validatorParams(lucid);

  const gitHoneyValidator = githoneyValidator(scriptParams);
  const validatorAddress = lucid.utils.validatorToAddress(gitHoneyValidator);
  const now = new Date();
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const tx = await lucid
    .newTx()
    .validTo(sixHoursFromNow.getTime())
    .payToContract(validatorAddress, { inline: GithoneyDatumT.default }, {})
    .attachSpendingValidator(gitHoneyValidator)
    .complete();

  const cbor = tx.toString();
  logger.info("END deploy");
  logger.info(`Deploy: ${cbor}`);
  return cbor;
}
