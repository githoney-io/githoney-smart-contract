import { describe, expect, it } from "@jest/globals";
import { OutRef } from "@spacebudz/lucid";
import {
  newAssign,
  newBounty,
  signSubmitAndWaitConfirmation,
} from "../utils.ts";
import { mergeBounty } from "../../operations/index.ts";
import { logger, lucidBase } from "../../utils/utils.ts";
import { adminAddr, adminSeed, settingsRef } from "../../constants.ts";

describe("Merge tests", () => {
  it("Merge bounty", async () => {
    const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);
    const createTxId = await newBounty(lucidBase, settingsUtxo);
    const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

    const assignTxId = await newAssign(lucidBase, createOutRef, settingsUtxo);
    const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

    const { mergeCbor } = await mergeBounty(
      adminAddr,
      settingsUtxo,
      assignOutRef,
    );
    lucidBase.selectWalletFromSeed(adminSeed);
    await signSubmitAndWaitConfirmation(mergeCbor, lucidBase);
  }, 300000);

  it("Merge bounty already merged", async () => {
    const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);
    try {
      const createTxId = await newBounty(lucidBase, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      const assignTxId = await newAssign(lucidBase, createOutRef, settingsUtxo);
      const assignOutRef: OutRef = { txHash: assignTxId, outputIndex: 0 };

      // First merge
      const { mergeCbor } = await mergeBounty(
        adminAddr,
        settingsUtxo,
        assignOutRef,
      );
      lucidBase.selectWalletFromSeed(adminSeed);
      const mergeTxId = await signSubmitAndWaitConfirmation(
        mergeCbor,
        lucidBase,
      );

      // Second merge
      const mergeOutRef: OutRef = {
        txHash: mergeTxId,
        outputIndex: 0,
      };
      await mergeBounty(adminAddr, settingsUtxo, mergeOutRef);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toBe("Bounty already merged");
    }
  }, 300000);

  it("Merge bounty without contributor", async () => {
    const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);
    try {
      const createTxId = await newBounty(lucidBase, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxId, outputIndex: 0 };

      await mergeBounty(adminAddr, settingsUtxo, createOutRef);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toBe("Bounty doesn't have a contributor");
    }
  }, 300000);
});
