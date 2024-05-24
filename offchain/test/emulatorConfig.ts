import {
  Assets,
  Emulator,
  fromText,
  generateSeedPhrase,
  Lucid,
  toUnit
} from "lucid-cardano";
import { controlTokenName } from "../src/constants";
import { createBounty } from "../src/operations/create";
import { buildGithoneyMintingPolicy } from "../src/scripts";
import { validatorParams } from "../src/utils";

const tokenA = {
  policy_id: "bab31a281f888aa25f6fd7b0754be83729069d66ad76c98be4a06deb",
  asset_name: "tokenA"
};

const tokenB = {
  policy_id: "e405207b08c38ea5815e2df27ad409b037adec32f7285ef0d15f6aa9",
  asset_name: "tokenB"
};

const tokenC = {
  policy_id: "e8399c4bb9c7bb89f11091469165e4c917229df34edbb2bb2d15c8b4",
  asset_name: "tokenC"
};

const lucid = await Lucid.new();
const scriptParams = validatorParams(lucid);
const mintingScript = buildGithoneyMintingPolicy(scriptParams);
const mintingPolicyid = lucid.utils.mintingPolicyToId(mintingScript);

const controlToken = {
  policy_id: mintingPolicyid,
  asset_name: controlTokenName
};

const bounty_id = "abc123";

const tokenAUnit = toUnit(tokenA.policy_id, fromText(tokenA.asset_name));
const tokenBUnit = toUnit(tokenB.policy_id, fromText(tokenB.asset_name));
const tokenCUnit = toUnit(tokenC.policy_id, fromText(tokenC.asset_name));
const controlTokenUnit = toUnit(
  controlToken.policy_id,
  fromText(controlToken.asset_name)
);

const generateAccount = async (assets: Assets) => {
  const seedPhrase = generateSeedPhrase();
  return {
    seedPhrase,
    address: await (await Lucid.new(undefined, "Custom"))
      .selectWalletFromSeed(seedPhrase)
      .wallet.address(),
    assets
  };
};

const ACCOUNT_ADMIN = await generateAccount({
  lovelace: 75_000_000n,
  [tokenAUnit]: 100_000_000n,
  [tokenBUnit]: 100_000_000n,
  [tokenCUnit]: 100_000_000n
});

const ACCOUNT_MANTAINER = await generateAccount({
  lovelace: 75_000_000n,
  [tokenAUnit]: 100_000_000n,
  [tokenBUnit]: 100_000_000n,
  [tokenCUnit]: 100_000_000n
});

const ACCOUNT_GITHONEY = await generateAccount({
  lovelace: 75_000_000n,
  [tokenAUnit]: 100_000_000n,
  [tokenBUnit]: 100_000_000n,
  [tokenCUnit]: 100_000_000n
});

const ACCOUNT_CONTRIBUTOR = await generateAccount({
  lovelace: 100n
});

const emulator = new Emulator([
  ACCOUNT_ADMIN,
  ACCOUNT_MANTAINER,
  ACCOUNT_CONTRIBUTOR,
  ACCOUNT_GITHONEY
]);

//////////////////// UTILS ////////////////////
export {
  ACCOUNT_ADMIN,
  ACCOUNT_MANTAINER,
  ACCOUNT_GITHONEY,
  emulator,
  tokenAUnit,
  tokenBUnit,
  tokenCUnit,
  controlTokenUnit,
  bounty_id
};
