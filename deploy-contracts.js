const BigNum = require("bn.js")
import * as fs from "fs"
const fetch = require("node-fetch")
import {
  StacksTestnet,
  StacksMainnet,
  broadcastTransaction,
  makeContractDeploy,
  TxBroadcastResultOk,
  TxBroadcastResultRejected,
} from "@stacks/transactions"

import { MAINNET, STACKS_API_URL } from './src/config.js'

const network = MAINNET ? new StacksMainnet() : new StacksTestnet()
network.coreApiUrl = STACKS_API_URL  // Is this needed except in case of custom node?


async function deployContract(contract_name) {
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
    if (
      (result as TxBroadcastResultRejected).reason === "ContractAlreadyExists"
    ) {
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

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function processing(tx, count): {
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

  await timeout(3000)
  return processing(tx, count + 1)
}

(async () => {
  await deployContract('oracle')
})()


// TODO(psq): replace owner 'SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR with ORACLE_PK (search and replace before deploying)