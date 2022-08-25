// Copyright (c) The Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import assert from 'assert';
import fs from 'fs';
import {
  AptosAccount,
  TxnBuilderTypes,
  BCS,
  MaybeHexString,
  HexString,
  AptosClient,
  FaucetClient,
} from 'aptos';

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

// export const NODE_URL = 'https://fullnode.devnet.aptoslabs.com';
export const NODE_URL = 'http://localhost:8080';
// export const FAUCET_URL = 'https://faucet.devnet.aptoslabs.com';
export const FAUCET_URL = 'http://localhost:8081';

// Helper to check account balance
export async function accountBalance(
  accountAddress: MaybeHexString
): Promise<number | null> {
  const resource = await client.getAccountResource(
    accountAddress,
    '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
  );
  if (resource == null) {
    return null;
  }

  return parseInt((resource.data as any)['coin']['value']);
}

const client = new AptosClient(NODE_URL);
const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

/** Publish a new module to the blockchain within the specified account */
export async function publishModule(
  accountFrom: AptosAccount,
  moduleHex: string
): Promise<string> {
  const moduleBundlePayload =
    new TxnBuilderTypes.TransactionPayloadModuleBundle(
      new TxnBuilderTypes.ModuleBundle([
        new TxnBuilderTypes.Module(new HexString(moduleHex).toUint8Array()),
      ])
    );

  const [{ sequence_number: sequenceNumber }, chainId] = await Promise.all([
    client.getAccount(accountFrom.address()),
    client.getChainId(),
  ]);

  const rawTxn = new TxnBuilderTypes.RawTransaction(
    TxnBuilderTypes.AccountAddress.fromHex(accountFrom.address()),
    BigInt(sequenceNumber),
    moduleBundlePayload,
    1000n,
    1n,
    BigInt(Math.floor(Date.now() / 1000) + 10),
    new TxnBuilderTypes.ChainId(chainId)
  );

  const bcsTxn = AptosClient.generateBCSTransaction(accountFrom, rawTxn);
  const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);

  return transactionRes.hash;
}

/** Retrieve the resource Message::MessageHolder::message */
async function getMessage(
  contractAddress: HexString,
  accountAddress: MaybeHexString
): Promise<string> {
  try {
    const resource = await client.getAccountResource(
      accountAddress,
      `${contractAddress.toString()}::message::MessageHolder`
    );
    return (resource as any).data['message'];
  } catch (_) {
    return '';
  }
}

/**  Potentially initialize and set the resource Message::MessageHolder::message */
async function setMessage(
  contractAddress: HexString,
  accountFrom: AptosAccount,
  message: string
): Promise<string> {
  const entryFunctionPayload =
    new TxnBuilderTypes.TransactionPayloadEntryFunction(
      TxnBuilderTypes.EntryFunction.natural(
        `${contractAddress.toString()}::message`,
        'set_message',
        [],
        [BCS.bcsSerializeStr(message)]
      )
    );

  const [{ sequence_number: sequenceNumber }, chainId] = await Promise.all([
    client.getAccount(accountFrom.address()),
    client.getChainId(),
  ]);

  const rawTxn = new TxnBuilderTypes.RawTransaction(
    TxnBuilderTypes.AccountAddress.fromHex(accountFrom.address()),
    BigInt(sequenceNumber),
    entryFunctionPayload,
    1000n,
    1n,
    BigInt(Math.floor(Date.now() / 1000) + 10),
    new TxnBuilderTypes.ChainId(chainId)
  );

  const bcsTxn = AptosClient.generateBCSTransaction(accountFrom, rawTxn);
  const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);

  return transactionRes.hash;
}

/** run our demo! */
async function main() {
  assert(
    process.argv.length == 3,
    'Expecting an argument that points to the helloblockchain module'
  );

  // Create two accounts, Alice and Bob, and fund Alice but not Bob
  const alice = new AptosAccount();
  const bob = new AptosAccount();

  console.log('\n=== Addresses ===');
  console.log(`Alice: ${alice.address()}`);
  console.log(`Bob: ${bob.address()}`);

  await faucetClient.fundAccount(alice.address(), 5_000);
  await faucetClient.fundAccount(bob.address(), 5_000);

  console.log('\n=== Initial Balances ===');
  console.log(`Alice: ${await accountBalance(alice.address())}`);
  console.log(`Bob: ${await accountBalance(bob.address())}`);

  await new Promise<void>((resolve) => {
    readline.question(
      "Update the module with Alice's address, build, copy to the provided path, and press enter.",
      () => {
        resolve();
        readline.close();
      }
    );
  });
  const modulePath = process.argv[2];
  const moduleHex = fs.readFileSync(modulePath).toString('hex');

  console.log('\n=== Testing Alice ===');
  console.log('Publishing...');

  let txHash = await publishModule(alice, moduleHex);
  await client.waitForTransaction(txHash);
  console.log(
    `Initial value: ${await getMessage(alice.address(), alice.address())}`
  );

  console.log('Setting the message to "Hello, Blockchain"');
  txHash = await setMessage(alice.address(), alice, 'Hello, Blockchain');
  await client.waitForTransaction(txHash);
  console.log(txHash, ' Alice txn hash')
  console.log(
    `New value: ${await getMessage(alice.address(), alice.address())}`
  );

  console.log('\n=== Testing Bob ===');
  console.log(
    `Initial value: ${await getMessage(alice.address(), bob.address())}`
  );
  console.log('Setting the message to "Hello, Blockchain"');
  txHash = await setMessage(alice.address(), bob, 'Hello, Blockchain');
  await client.waitForTransaction(txHash);
  console.log(`New value: ${await getMessage(alice.address(), bob.address())}`);
}

if (require.main === module) {
  main().then((resp) => console.log(resp));
}
