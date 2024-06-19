import { describe, it } from "mocha";
import {
  deployUtxo,
  newAssign,
  newBounty,
  newMerge,
  signAndSubmit
} from "../utils";
import { assignContributor } from "../../src";
import {
  emulator,
  ACCOUNT_CONTRIBUTOR,
  ACCOUNT_0,
  lucid
} from "../emulatorConfig";
import { Lucid, OutRef } from "lucid-cardano";
import { expect } from "chai";
import logger from "../../src/logger";

describe("Assign Contributor tests", async () => {
  it("Assign Contributor", async () => {
    const settingsUtxo = await deployUtxo(lucid);
    const createTxIdId = await newBounty(lucid, settingsUtxo);
    const bountyOutRef: OutRef = { txHash: createTxIdId, outputIndex: 0 };

    const assignTx = await assignContributor(
      settingsUtxo,
      bountyOutRef,
      ACCOUNT_CONTRIBUTOR.address,
      lucid
    );
    emulator.awaitBlock(3);

    lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
    await signAndSubmit(lucid, assignTx);
  });

  it("Assign Contributor with already merged bounty", async () => {
    const settingsUtxo = await deployUtxo(lucid);
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucid, createOutRef, settingsUtxo);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      const mergeTxId = await newMerge(lucid, assignOutRef, settingsUtxo);
      const mergeOutRef: OutRef = { txHash: mergeTxId, outputIndex: 0 };

      await assignContributor(
        settingsUtxo,
        mergeOutRef,
        ACCOUNT_CONTRIBUTOR.address,
        lucid
      );
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).to.equal("Bounty already merged");
    }
  });

  it("Assign Contributor with contributor already assigned", async () => {
    const settingsUtxo = await deployUtxo(lucid);
    try {
      const createTxId = await newBounty(lucid, settingsUtxo);
      const bountyOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };
      const assignTx = await assignContributor(
        settingsUtxo,
        bountyOutRef,
        ACCOUNT_CONTRIBUTOR.address,
        lucid
      );
      emulator.awaitBlock(3);

      lucid.selectWalletFromSeed(ACCOUNT_CONTRIBUTOR.seedPhrase);
      const txId = await signAndSubmit(lucid, assignTx);

      await assignContributor(
        settingsUtxo,
        { txHash: txId, outputIndex: 0 },
        ACCOUNT_0.address,
        lucid
      );
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).to.equal("Bounty already has a contributor");
    }
  });
});
