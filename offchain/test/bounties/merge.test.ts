import { describe, it } from "mocha";
import { ACCOUNT_ADMIN, emulator, lucid } from "../emulatorConfig";
import { OutRef } from "lucid-cardano";
import { mergeBounty } from "../../src/operations/bounties/merge";
import { deployUtxo, newAssign, newBounty, signAndSubmit } from "../utils";
import { expect } from "chai";
import logger from "../../src/logger";

describe("Merge tests", async () => {
  it("Merge bounty", async () => {
    const settingsUtxo = await deployUtxo(lucid);
    const createTxIdId = await newBounty(lucid, settingsUtxo);
    const createOutRef: OutRef = { txHash: createTxIdId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const mergeTx = await mergeBounty(settingsUtxo, assignOutRef, lucid);
    emulator.awaitBlock(3);

    lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
    await signAndSubmit(lucid, mergeTx);
  });

  it("Merge bounty already merged", async () => {
    const settingsUtxo = await deployUtxo(lucid);
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      // First merge
      const mergeTx = await mergeBounty(settingsUtxo, assignOutRef, lucid);
      emulator.awaitBlock(3);
      lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
      const mergeTxId = await signAndSubmit(lucid, mergeTx);
      emulator.awaitBlock(3);

      // Second merge
      const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };
      await mergeBounty(settingsUtxo, mergeOutRef, lucid);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).to.equal("Bounty already merged");
    }
  });

  it("Merge bounty without contributor", async () => {
    const settingsUtxo = await deployUtxo(lucid);
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const bountyOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };
      logger.info(`Bounty created with txId: ${createTxId}`);
      await mergeBounty(settingsUtxo, bountyOutRef, lucid);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).to.equal("Bounty doesn't have a contributor");
    }
  });
});
