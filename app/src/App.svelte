<script lang="ts">
	import { onMount } from "svelte";
	
	import * as idl from "./idl/gm_solana.json";
	import type { GmSolana } from "./types/gm_solana";
	import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js"
	import type { Idl } from "@project-serum/anchor"
	import { Program, AnchorProvider, web3 } from "@project-serum/anchor"

	const { SystemProgram, Keypair } = web3
	
	let wallet: any;
	let account = "";

	$: account && console.log(`Connected to wallet: ${account}`)
	const onLoad = async () => {
		const { solana } = window as any;
		wallet = solana;

		wallet.on("connect", () => (account = wallet.publicKey.toString()))
		wallet.on("disconnect", () => (account = ""))
		
		// eagerly connect wallet if the user already has connected before, otherwise do nothing
		const resp = await wallet.connect({ onlyIfTrusted: true})
	}
	
	onMount(() => {
		window.addEventListener("load", onLoad);
		return () => window.removeEventListener("load", onLoad);
	})
	
	const handleConnectWallet = async () => {
		const resp = await wallet.connect();
	}
	
	const programId = new PublicKey(idl.metadata.address)
	
	// Local endpoint for now
	// const network = "http://127.0.0.1:8899"
	const network = clusterApiUrl("devnet")
	
	const connection = new Connection(network, "confirmed")
	
	const getProvider = () => {
		const provider = new AnchorProvider(connection, wallet, {
			preflightCommitment: "confirmed",
		})
		return provider;
	}
	
	const getProgram = () => {
		const program = new Program(
			idl as Idl, 
			programId,
			getProvider(),
		) as Program<GmSolana>
		return program;
	}

	// ======== INITIATE BASE ACCOUNT ========
	
	let baseAccountPublicKey: PublicKey;
	let baseAccountPublicKeyInput = ""; // UI state
	
	const initializeAccount = async () => {
		const provider = getProvider();
		const program = getProgram();
		const _baseAccount = Keypair.generate();
		Keypair;
    await program.methods
      .initialize()
      .accounts({
				baseAccount: _baseAccount.publicKey,
        systemProgram: SystemProgram.programId,
        user: provider.wallet.publicKey,
      })
      .signers([_baseAccount])
      .rpc();
		
		baseAccountPublicKey = _baseAccount.publicKey;
		console.log("New BaseAccount: ", baseAccountPublicKey.toString())
		await getGmList();
	}
		
	const loadAccount = async () => {
		baseAccountPublicKey = new PublicKey(baseAccountPublicKeyInput);
		console.log("Loaded BaseAccount:", baseAccountPublicKey.toString());
		await getGmList();
	}
	
	let gmList = [];
	let gmMessage = "";

	const getGmList = async () => {
		const program = getProgram();
		const account = await program.account.baseAccount.fetch(
			baseAccountPublicKey
		)
		console.log("Got the account: ", account)
		gmList = account.gmList as any[]
	}
	
	const sayGm = async () => {
		const provider = getProvider();
		const program = getProgram();
    await program.methods
      .sayGm(gmMessage)
      .accounts({
        baseAccount: baseAccountPublicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();
			
		console.log("gm successfully sent", gmMessage)
		gmMessage = ""; // clear input field

		await getGmList(); // update list
	}
	$: console.log("gmList:", gmList); // just some extra logging when the gm list changes

</script>

<main>
	<h1>gm, Solana!</h1>
	{#if account}
	<h3>Your wallet:</h3>
	<p>{account}</p>
	{:else if wallet} {#if wallet.isPhantom}
	<h2>Phantom wallet found!</h2>
	<button on:click="{handleConnectWallet}">Connect Wallet</button>
	{:else}
	<h2>Solana wallet found but not supported.</h2>
	{/if}{:else}
	<h2>Solana wallet not found.</h2>
	{/if}
	

	{#if account}
		{#if !baseAccountPublicKey}
			<button on:click={initializeAccount}>Initialize Account</button>
			or
			<input
				type="text"
				placeholder="use existing account..."
				bind:value={baseAccountPublicKeyInput}
			/>
			<button on:click={loadAccount}>Load</button>
		{:else}
			Using gm solana base account {baseAccountPublicKey.toString()}
		{/if}
	{/if}
	
	{#if baseAccountPublicKey}
		<div>
			<h3>gm List:</h3>
			<ul>
				{#each gmList as gm}
					<li>
						{new PublicKey(gm.user).toString().slice(0,6)}... said:
						<b>{gm.message}</b>,
						 at {new Date(gm.timestamp.toNumber() * 1000).toLocaleTimeString()}
					</li>
				{/each}
			</ul>
			<button on:click={getGmList}>Refresh gms!</button>
		</div>
		
		<div>
			<h3>Say gm:</h3>
			<input
				type="text"
				placeholder="write something..."
				bind:value={gmMessage}
			/>
			<button on:click={sayGm} disabled={!gmMessage}>Say gm!</button>
		</div>
	{/if}
	
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>