import BigNum from 'bn.js'
import fs from "fs"
import fetch from 'node-fetch'
import {
  broadcastTransaction,
  makeContractDeploy,
} from '@stacks/transactions'

import {
  StacksMainnet,
  StacksTestnet,
  StacksMocknet,
} from '@stacks/network'

import {
  MODE,
  ORACLE_PK,
  ORACLE_SK,
  ORACLE_STX,
  STACKS_API_URL,
} from './src/config.js'

console.log("mode", MODE)
console.log("api", STACKS_API_URL)

const network = MODE === 'mainnet' ? new StacksMainnet() : MODE === 'testnet' ? new StacksTestnet() : new StacksMocknet()
network.coreApiUrl = STACKS_API_URL  // Is this needed except in case of custom node?

async function deployContract(contract_file, contract_name) {
  console.log(`deploying ${contract_name}`)
  const body = fs.readFileSync(`./contracts/${contract_file}.clar`).toString()
  const codeBody = body
    .replace('SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR', ORACLE_STX)
    .replace('0367b2946150dfab1862457da80beb522440be5737ea51ba14cf8018a12911128f', ORACLE_PK)
    .replace('ST31HHVBKYCYQQJ5AQ25ZHA6W2A548ZADDQ6S16GP', ORACLE_STX)

  const transaction = await makeContractDeploy({
    contractName: contract_name,
    codeBody,
    senderKey: ORACLE_SK,
    network,
  })

  const result = await broadcastTransaction(transaction, network)
  if (result.error) {
    if (result.reason === "ContractAlreadyExists") {
      console.log(`${contract_name} already deployed`)
      return result
    } else {
      throw new Error(
        `failed to deploy ${contract_name}: ${JSON.stringify(result)}`
      )
    }
  }
  const processed = await processing(result, 0)
  if (!processed) {
    throw new Error(`failed to deploy ${contract_name}: transaction not found`)
  }
  return result
}

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function processing(tx, count) {
  console.log("processing", tx)
  var result = await fetch(
    `${STACKS_API_URL}/extended/v1/tx/${tx}`
  )
  var value = await result.json()
  if (value.tx_status === "success") {
    console.log(`transaction ${tx} processed`)
    // console.log(value)
    return true
  }
  if (count > 20) {
    console.log("failed after 20 attempts", value)
    return false
  }

  await timeout(30000)
  return processing(tx, count + 1)
}

(async () => {
  await deployContract('oracle', 'oracle-v0-0-2')
})()
