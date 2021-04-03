import {
  getNonce,
  timeout,
} from './src/tx-utils.js'
import {
  addPrices,
} from './src/clients/oracle-client-tx.js'

import { retrieveCoinbaseOracleFeed } from './src/feeds/coinbase-oracle.js'
import { retrieveOKCoinOracleFeed } from './src/feeds/okcoin-oracle.js'
import { retrieveBinanceFeed } from './src/feeds/binance.js'
import { retrieveOKCoinFeed } from './src/feeds/okcoin.js'

// TODO(psq): need a way to restore safely, store nonce maybe, and read at the beginning?

let nonce = await getNonce()
while (true) {
  const coinbase_oracle_feed = await retrieveCoinbaseOracleFeed()
  const okcoin_oracle_feed = await retrieveOKCoinOracleFeed()
  const binance_feed = await retrieveBinanceFeed()
  const okcoin_feed = await retrieveOKCoinFeed()

  const feed = coinbase_oracle_feed.concat(okcoin_oracle_feed.concat(binance_feed.concat(okcoin_feed)))

  console.log("feed", feed.length)
  const result = await addPrices(feed)
  let next_nonce = await getNonce()
  while (next_nonce === nonce) {
    await timeout(1000 * 60 * 2)
    next_nonce = await getNonce()
  }
  nonce = next_nonce
  console.log("new nonce", nonce)
}


// const processed = await processing(result, 0, 25)
