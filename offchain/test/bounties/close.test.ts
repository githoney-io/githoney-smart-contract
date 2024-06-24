import { describe, it } from "mocha";
import { ACCOUNT_ADMIN, emulator, lucid } from "../emulatorConfig";
import { OutRef } from "lucid-cardano";
import { mergeBounty } from "../../src/operations/bounties/merge";
import { closeBounty } from "../../src/operations/bounties/close";
import { deployUtxo, newAssign, newBounty, signAndSubmit } from "../utils";
import { expect } from "chai";
import logger from "../../src/logger";

describe("Close tests", async () => {
  it("Close Bounty After Contributor Assignment", async () => {
    const settingsUtxo = await deployUtxo(lucid);
    const createTxId = await newBounty(lucid, settingsUtxo);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const closeTx = await closeBounty(settingsUtxo, assignOutRef, lucid);
    emulator.awaitBlock(3);

    lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
    await signAndSubmit(lucid, closeTx);
  });

  it("Close Bounty Before Contributor Assignment", async () => {
    const settingsUtxo = await deployUtxo(lucid);
    const createTxId = await newBounty(lucid, settingsUtxo);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const closeTx = await closeBounty(settingsUtxo, createOutRef, lucid);
    emulator.awaitBlock(3);

    lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
    await signAndSubmit(lucid, closeTx);
  });

  it("Close Bounty already merged", async () => {
    const settingsUtxo = await deployUtxo(lucid);
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      const mergeTx = await mergeBounty(settingsUtxo, assignOutRef, lucid);
      emulator.awaitBlock(3);

      lucid.selectWalletFromSeed(ACCOUNT_ADMIN.seedPhrase);
      const mergeTxId = await signAndSubmit(lucid, mergeTx);
      const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

      await closeBounty(settingsUtxo, mergeOutRef, lucid);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).to.equal("Bounty already merged");
    }
  });
});
