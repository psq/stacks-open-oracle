import BigNum from 'bn.js'
import fs from "fs"
import fetch from 'node-fetch'
import {
  bufferCV,
  listCV,
  tupleCV,
  stringAsciiCV,

  broadcastTransaction,
  makeContractCall,

  PostConditionMode,
} from "@stacks/transactions"

import {
  StacksMainnet,
  StacksTestnet,
  StacksMocknet,
} from '@stacks/network'

import {
  MODE,
  ORACLE_SK,
  ORACLE_STX,
  STACKS_API_URL,
} from './src/config.js'

import { retrieveCoinbaseOracleFeed } from './src/feeds/coinbase-oracle.js'
import { retrieveOKCoinOracleFeed } from './src/feeds/okcoin-oracle.js'
import { retrieveBinanceFeed } from './src/feeds/binance.js'
import { retrieveOKCoinFeed } from './src/feeds/okcoin.js'

console.log("mode", MODE)
console.log("api", STACKS_API_URL)

const network = MODE === 'mainnet' ? new StacksMainnet() : MODE === 'testnet' ? new StacksTestnet() : new StacksMocknet()
network.coreApiUrl = STACKS_API_URL  // Is this needed except in case of custom node?

function buildPrice(price) {
  return tupleCV({
    src: stringAsciiCV(price.src),
    msg: bufferCV(price.msg),
    sig: bufferCV(price.sig),
  })
}

function buildPriceList(prices) {
  return listCV(prices.map(price => buildPrice(price)))
}

async function addPrices(contract_name, prices) {
  console.log("addPrices", contract_name /*, prices*/)
  const transaction = await makeContractCall({
    contractAddress: ORACLE_STX,
    contractName: contract_name,
    functionName: 'add-prices',
    functionArgs: [buildPriceList(prices)],
    senderKey: ORACLE_SK,
    network,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [
    ],
  })
  // console.log("transaction", transaction.payload)
  const serialized = transaction.serialize().toString('hex')
  console.log("serialized", serialized, serialized.length)

  const result = await broadcastTransaction(transaction, network)
  console.log("result", result)
  if (result.error) {
    console.log(result.reason)
    throw new Error(`transaction failed`)
  }
  const processed = await processing(result, 0)
  if (!processed) {
    throw new Error(`failed to execute add-prices`)
  }
}

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function processing(tx, count = 0) {
  console.log("processing", tx, count)
  var result = await fetch(
    `${STACKS_API_URL}/extended/v1/tx/${tx}`
  )
  var value = await result.json()
  if (value.tx_status === "success") {
    console.log(`transaction ${tx} processed`)
    // console.log(value)
    return true
  }
  // if (value.tx_status === "pending") {
  //   console.log("pending" /*, value*/)
  // }
  if (count > 10) {
    console.log("failed after 2 attempts", value)
    return false
  }

  await timeout(5000)
  return processing(tx, count + 1)
}

(async () => {
  const coinbase_oracle_feed = await retrieveCoinbaseOracleFeed()
  const okcoin_oracle_feed = await retrieveOKCoinOracleFeed()
  const binance_feed = await retrieveBinanceFeed()
  const okcoin_feed = await retrieveOKCoinFeed()

  const feed = coinbase_oracle_feed.concat(okcoin_oracle_feed.concat(binance_feed.concat(okcoin_feed)))

  addPrices('oracle-v0-0-2', feed)
})()
