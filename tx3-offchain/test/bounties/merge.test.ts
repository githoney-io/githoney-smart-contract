import { describe, expect, it } from "@jest/globals";
import { OutRef } from "@spacebudz/lucid";
import { logger, newAssign, newBounty, waitForUtxosUpdate } from "../utils.ts";
import { mergeBounty } from "../../operations/index.ts";
import { lucidBase, signAndSubmit } from "../../utils/utils.ts";
import { adminAddr, adminSeed, settingsRef } from "../../constants.ts";

describe("Merge tests", async () => {
  it("Merge bounty", async () => {
    const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);
    const createTxHash = await newBounty(lucidBase, settingsUtxo);
    const createOutRef: OutRef = { txHash: createTxHash, outputIndex: 0 };

    const assignTxHash = await newAssign(lucidBase, createOutRef, settingsUtxo);
    const assignOutRef: OutRef = { txHash: assignTxHash, outputIndex: 0 };

    const { mergeCbor } = await mergeBounty(
      adminAddr,
      settingsUtxo,
      assignOutRef,
    );
    lucidBase.selectWalletFromSeed(adminSeed);
    const mergeTxHash = await signAndSubmit(mergeCbor, lucidBase);
    waitForUtxosUpdate(lucidBase, mergeTxHash);
  });

  it("Merge bounty already merged", async () => {
    const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);
    try {
      const createTxHash = await newBounty(lucidBase, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxHash, outputIndex: 0 };

      const assignTxHash = await newAssign(
        lucidBase,
        createOutRef,
        settingsUtxo,
      );
      const assignOutRef: OutRef = { txHash: assignTxHash, outputIndex: 0 };

      // First merge
      const { mergeCbor } = await mergeBounty(
        adminAddr,
        settingsUtxo,
        assignOutRef,
      );
      lucidBase.selectWalletFromSeed(adminSeed);
      const mergeTxHash = await signAndSubmit(mergeCbor, lucidBase);
      waitForUtxosUpdate(lucidBase, mergeTxHash);

      // Second merge
      const mergeOutRef: OutRef = { txHash: mergeTxHash, outputIndex: 0 };
      await mergeBounty(adminAddr, settingsUtxo, mergeOutRef);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toBe("Bounty already merged");
    }
  });

  it("Merge bounty without contributor", async () => {
    const [settingsUtxo] = await lucidBase.utxosByOutRef([settingsRef]);
    try {
      const createTxHash = await newBounty(lucidBase, settingsUtxo);
      const createOutRef: OutRef = { txHash: createTxHash, outputIndex: 0 };

      logger.info(`Bounty created with txId: ${createTxHash}`);
      await mergeBounty(adminAddr, settingsUtxo, createOutRef);
    } catch (e) {
      const error = e as Error;
      logger.error(error.message);
      expect(error.message).toBe("Bounty doesn't have a contributor");
    }
  });
});
