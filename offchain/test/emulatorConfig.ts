import {
  Assets,
  Emulator,
  fromText,
  generateSeedPhrase,
  Lucid,
  toUnit
} from "lucid-cardano";
import { controlTokenName, githoneyAddr } from "../src/constants";
import { githoneyMintingPolicy } from "../src/scripts";
import { validatorParams } from "../src/utils";

const tokenA = {
  policy_id: "bab31a281f888aa25f6fd7b0754be83729069d66ad76c98be4a06deb",
  asset_name: "tokenA"
};

const lucid = await Lucid.new();
const scriptParams = validatorParams(lucid);
const mintingScript = githoneyMintingPolicy(scriptParams);
const mintingPolicyid = lucid.utils.mintingPolicyToId(mintingScript);

const controlToken = {
  policy_id: mintingPolicyid,
  asset_name: controlTokenName
};

const bounty_id = "Bounty Name Test";

const tokenAUnit = toUnit(tokenA.policy_id, fromText(tokenA.asset_name));

const bountyIdTokenUnit = toUnit(
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
  lovelace: 1_000_000_000n,
  [tokenAUnit]: 1_000_000_000n
});

const ACCOUNT_MANTAINER = await generateAccount({
  lovelace: 1_000_000_000n,
  [tokenAUnit]: 1_000_000_000n
});

const ACCOUNT_GITHONEY = {
  address: await (await Lucid.new(undefined, "Custom"))
    .selectWalletFrom({ address: githoneyAddr })
    .wallet.address(),
  assets: {
    lovelace: 1_000_000_000n,
    [tokenAUnit]: 1_000_000_000n
  }
};

const ACCOUNT_0 = await generateAccount({
  lovelace: 1_000_000_000n,
  [tokenAUnit]: 1_000_000_000n
});

const ACCOUNT_CONTRIBUTOR = await generateAccount({
  lovelace: 50_000_000n
});

const emulator = new Emulator([
  ACCOUNT_ADMIN,
  ACCOUNT_MANTAINER,
  ACCOUNT_CONTRIBUTOR,
  ACCOUNT_GITHONEY,
  ACCOUNT_0
]);

export {
  ACCOUNT_ADMIN,
  ACCOUNT_MANTAINER,
  ACCOUNT_GITHONEY,
  ACCOUNT_CONTRIBUTOR,
  ACCOUNT_0,
  emulator,
  tokenAUnit,
  bountyIdTokenUnit,
  bounty_id
};
