import { describe, it } from "mocha";
import { expect } from "chai";
import {
  ACCOUNT_ADMIN,
  ACCOUNT_MANTAINER,
  bounty_id,
  emulator
} from "../emulatorConfig";
import { Lucid } from "lucid-cardano";
import { createBounty } from "../../src/operations/bounties/create";
import { deployUtxo, signAndSubmit } from "../utils";
import logger from "../../src/logger";
import { assert } from "console";
import { SettingsDatum } from "../../src/types";
import { validatorParams } from "../../src/utils";

const lucid = await Lucid.new(emulator, "Custom");

describe("Deploy tests", async () => {
  it("Deploy settings", async () => {
    const settingsUtxo = await deployUtxo(lucid);
    const datum = lucid.datumOf(settingsUtxo, SettingsDatum);
    const expectedDatum = validatorParams(lucid);
    Object.entries(datum).forEach(([key, value]) => {
      logger.info(`${key}: ${value}`);
      assert(value === expectedDatum[key]);
    });
  });
});
