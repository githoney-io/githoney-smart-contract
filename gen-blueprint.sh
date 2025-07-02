I_PWD=$PWD
cd onchain/
deno run -A https://deno.land/x/lucid/blueprint.ts || { echo "Deno script failed"; exit 1; }
if [ -f "plutus.ts" ]; then
    mv plutus.ts "$I_PWD/offchain/src/plutus.ts"
    cp "$I_PWD/offchain/src/plutus.ts" "$I_PWD/tx3-offchain/plutus.ts"
else
    echo "plutus.ts not found!"
    exit 1
fi
cd $I_PWD

# Replace import path and redundant Data type export
SCRIPT_NAME=$(basename "$0")
LUCID="@spacebudz/lucid"
 # TODO: regex to match any version of this file
DENO_PATH="https://deno.land/x/lucid/mod.ts"
grep -rl "$DENO_PATH" . | grep -v "$SCRIPT_NAME" |  xargs sed -i "s#$DENO_PATH#$LUCID#g"
grep -rl "export type Data = Data;" . | grep -v "$SCRIPT_NAME" | xargs sed -i "/export type Data = Data;/d"
