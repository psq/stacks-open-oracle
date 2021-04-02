import BigNum from 'bn.js'
import fs from "fs"
import fetch from 'node-fetch'

import {
  serializeCV,
  deserializeCV,

  ClarityType,

  stringAsciiCV,
} from '@stacks/transactions'
import {
  ORACLE_STX,
  STACKS_API_URL,
} from './src/config.js'

async function getPrice(contract_name, source, symbol) {
  // console.log("getPrice", contract_name, source, symbol)
  const function_name = 'get-price'

  const sourceCV = serializeCV(stringAsciiCV(source))
  const symbolCV = serializeCV(stringAsciiCV(symbol))

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: `{"sender":"${ORACLE_STX}","arguments":["0x${sourceCV.toString("hex")}","0x${symbolCV.toString("hex")}"]}`,
  }
  // console.log("body", options.body)
  const response = await fetch(`${STACKS_API_URL}/v2/contracts/call-read/${ORACLE_STX}/${contract_name}/${function_name}`, options)

  if (response.ok) {
    const result = await response.json()
    if (result.okay) {
      const result_value = deserializeCV(Buffer.from(result.result.substr(2), "hex"))
      // console.log("result_value", result_value)
      // console.log("result_value", result_value.value.data)
      if (result_value.type === ClarityType.OptionalSome) {
        return {
          amount: result_value.value.data.amount.value.toString(),  // TODO(psq): need decimal information to use toNumber() to avoid overflow (thanks ETH)
          height: result_value.value.data.height.value.toNumber(),
          timestamp: result_value.value.data.timestamp.value.toNumber(),
        }
      } else {
        return null
      }

      return result_data.value.value
    } else {
      console.log(result)
    }
  } else {
    console.log("not 200 response", response)
  }
}

async function checkPrice(contract, source, symbol) {
  const value = await getPrice(contract, source, symbol)
  if (value) {
    console.log(source, symbol, value.amount, value.height, value.timestamp, new Date(value.timestamp * 1000))
  } else {
    console.log(source, symbol, "no result")
  }
}

const contract = 'oracle-v0-0-2'
await checkPrice(contract, 'artifix-okcoin', 'TEST')

await checkPrice(contract, 'coinbase', 'BTC')
await checkPrice(contract, 'coinbase', 'ETH')
await checkPrice(contract, 'coinbase', 'LINK')
await checkPrice(contract, 'coinbase', 'COMP')
await checkPrice(contract, 'coinbase', 'UNI')
await checkPrice(contract, 'coinbase', 'SNX')

await checkPrice(contract, 'okcoin', 'BTC')
await checkPrice(contract, 'okcoin', 'ETH')

await checkPrice(contract, 'artifix-okcoin', 'BTC')
await checkPrice(contract, 'artifix-okcoin', 'ETH')
await checkPrice(contract, 'artifix-okcoin', 'LINK')
await checkPrice(contract, 'artifix-okcoin', 'STX-BTC')
await checkPrice(contract, 'artifix-okcoin', 'STX')
await checkPrice(contract, 'artifix-okcoin', 'COMP')
await checkPrice(contract, 'artifix-okcoin', 'LTC')
await checkPrice(contract, 'artifix-okcoin', 'UNI')

await checkPrice(contract, 'artifix-binance', 'ETH-BTC')
await checkPrice(contract, 'artifix-binance', 'LINK-BTC')
await checkPrice(contract, 'artifix-binance', 'LINK-ETH')
await checkPrice(contract, 'artifix-binance', 'STX-BTC')
await checkPrice(contract, 'artifix-binance', 'STX-USDT')
await checkPrice(contract, 'artifix-binance', 'COMP-BTC')
await checkPrice(contract, 'artifix-binance', 'LTC-BTC')
await checkPrice(contract, 'artifix-binance', 'UNI-BTC')
await checkPrice(contract, 'artifix-binance', 'AAVE-BTC')
await checkPrice(contract, 'artifix-binance', 'SUSHI-BTC')

