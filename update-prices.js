const BigNum = require("bn.js")
import * as fs from "fs"
const fetch = require("node-fetch")
import {
  StacksTestnet,
  StacksMainnet,

  contractPrincipalCV,
  stringAsciiCV,
  uintCV,

  broadcastTransaction,
  makeContractCall,
  makeContractDeploy,
  TxBroadcastResultOk,
  TxBroadcastResultRejected,

  PostConditionMode,
} from "@stacks/transactions"

import { STACKS_API_URL } from './src/config.js'


const network = new StacksTestnet()
network.coreApiUrl = STACKS_API_URL


async function deployContract(contract_name, fee) {
  console.log(`deploying ${contract_name}`)
  const codeBody = fs.readFileSync(`./contracts/${contract_name}.clar`).toString()

  const transaction = await makeContractDeploy({
    contractName: contract_name,
    codeBody,
    senderKey: keys.swapr.privateKey,
    network,
  })

  const result = await broadcastTransaction(transaction, network)
  if ((result as TxBroadcastResultRejected).error) {
    if ((result as TxBroadcastResultRejected).reason === "ContractAlreadyExists") {
      console.log(`${contract_name} already deployed`)
      return "" as TxBroadcastResultOk
    } else {
      throw new Error(
        `failed to deploy ${contract_name}: ${JSON.stringify(result)}`
      )
    }
  }
  const processed = await processing(result as TxBroadcastResultOk)
  if (!processed) {
    throw new Error(`failed to deploy ${contract_name}: transaction not found`)
  }
  return result as TxBroadcastResultOk
}


async function createPair(token_1, token_2, token_1_2, name, amount_1, amount_2) {
  console.log("createPair", token_1, token_2, token_1_2, name, amount_1, amount_2)
  const fee = new BigNum(311)
  const addr = 'ST3J2GVMMM2R07ZFBJDWTYEYAR8FZH5WKDTFJ9AHA'
  const transaction = await makeContractCall({
    contractAddress: addr,
    contractName: 'swapr',
    functionName: 'create-pair',
    functionArgs: [contractPrincipalCV(addr, token_1), contractPrincipalCV(addr, token_2), contractPrincipalCV(addr, token_1_2), stringAsciiCV(name), uintCV(amount_1), uintCV(amount_2)],
    senderKey: keys.swapr.privateKey,
    network,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [
    ],
    fee,
  })
  console.log("transaction", transaction.payload)
  const serialized = transaction.serialize().toString('hex')
  console.log("serialized", serialized)
  const result = await broadcastTransaction(transaction, network)
  console.log("result", result)
  if ((result as TxBroadcastResultRejected).error) {
    console.log((result as TxBroadcastResultRejected).reason)
    throw new Error(`failed create pair ${token_1} - ${token_2}`)
  }
  const processed = await processing(result as TxBroadcastResultOk)
  if (!processed) {
    throw new Error(`failed to execute create-pair`)
  }
}



function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function processing(tx, count = 0): Promise<boolean> {
  console.log("processing", tx)
  var result = await fetch(
    `${STACKS_API_URL}/extended/v1/tx/${tx}`
  )
  var value = await result.json()
  console.log(count)
  if (value.tx_status === "success") {
    console.log(`transaction ${tx} processed`)
    // console.log(value)
    return true
  }
  if (value.tx_status === "pending") {
    console.log("pending" /*, value*/)
  }
  if (count > 2) {
    console.log("failed after 2 attempts", value)
    return false
  }

  await timeout(5000)
  return processing(tx, count + 1)
}

(async () => {
  const flexr_token = 'flexr-token'
  const stx_token = 'stx-token'
  const plaid_token = 'plaid-token'
  const flexr_stx_token = 'flexr-stx-token'
  const plaid_stx_token = 'plaid-stx-token'

  // create flexr-stx pair
  await createPair(flexr_token, stx_token, flexr_stx_token, "flexr-stx", 50_000_000_000_000, 50_000_000_000_000)

  // create plaid-stx pair
  await createPair(plaid_token, stx_token, plaid_stx_token, "plaid-stx", 50_000_000_000_000, 50_000_000_000_000)

})()
