import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GmSolana } from "../target/types/gm_solana";
import assert from "assert";

const { SystemProgram } = anchor.web3;

describe("gm-solana", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GmSolana as Program<GmSolana>;

  let _baseAccount: anchor.web3.Keypair;

  it("creates a base account for gm's", async () => {
    const baseAccount = anchor.web3.Keypair.generate();

    // Add your test here.
    const tx = await program.methods
      .initialize()
      .accounts({
        baseAccount: baseAccount.publicKey,
        systemProgram: SystemProgram.programId,
        user: provider.wallet.publicKey,
      })
      .signers([baseAccount])
      .rpc();

    // Fetch the base account
    const account = await program.account.baseAccount.fetch(
      baseAccount.publicKey
    );

    assert.deepEqual(account.gmCount.toString(), "0");

    _baseAccount = baseAccount;
    console.log("Your transaction signature", tx);
  });

  it("recieves and saves a gm message", async () => {
    const message = "gm wagmi";
    const user = provider.wallet.publicKey;

    // fetch the base account and cache how many messages are there
    const accountBefore = await program.account.baseAccount.fetch(
      _baseAccount.publicKey
    );
    const gmCountBefore = accountBefore.gmCount;

    // post a message
    const tx = await program.methods
      .sayGm(message)
      .accounts({
        baseAccount: _baseAccount.publicKey,
        user,
      })
      .rpc();

    console.log("Your transaction signature", tx);

    const accountAfter = await program.account.baseAccount.fetch(
      _baseAccount.publicKey
    );
    const gmCountAfter = accountAfter.gmCount;
    assert.equal(gmCountAfter.sub(gmCountBefore).toString(), "1");

    const gmList = accountAfter.gmList;
    assert.equal(gmList[0].message, message);
    assert.equal(gmList[0].user.equals(user), true); // user is an object, we can't just compare objects in JS
    assert.equal(gmList[0].timestamp.gt(new anchor.BN(0)), true); // just a loose check to see if the timestamp is greater than 0
  });
});
