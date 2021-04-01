import clarity from '@blockstack/clarity'
const { Client, Provider, ProviderRegistry, Result } = clarity

import { readFileSync } from 'fs'


import chai from 'chai'
// chai.use(require('chai-string'))
const assert = chai.assert

import { providerWithInitialAllocations } from './providerWithInitialAllocations.js';

import { OracleClient } from '../../src/clients/oracle-client.js'

import {
  NoLiquidityError,
  NotOKErr,
  NotOwnerError,
  TransferError,
} from '../../src/errors.js'

import { retrieveCoinbaseOracleFeed } from '../../src/feeds/coinbase-oracle.js'
import { retrieveOKCoinOracleFeed } from '../../src/feeds/okcoin-oracle.js'
import { retrieveBinanceFeed } from '../../src/feeds/binance.js'
import { retrieveOKCoinFeed } from '../../src/feeds/okcoin.js'

const balances = JSON.parse(readFileSync('./balances.json'))


describe("full test suite", () => {
  let provider
  let oracleClient

  const addresses = [
    'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',  // alice, u20 tokens of each
    'S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE',  // bob, u10 tokens of each
    'SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR',  // zoe, no tokens
    'SP138CBPVKYBQQ480EZXJQK89HCHY32XBQ0T4BCCD',  // TBD
    'SP30JX68J79SMTTN0D2KXQAJBFVYY56BZJEYS3X0B',  // flexr treasury
  ]

  const alice = addresses[0]
  const bob = addresses[1]
  const zoe = addresses[2]
  const flexr_treasury = `${addresses[4]}`
  const flexr_token = `ST3J2GVMMM2R07ZFBJDWTYEYAR8FZH5WKDTFJ9AHA.flexr-token`
  const flexr_stx_token = `ST3J2GVMMM2R07ZFBJDWTYEYAR8FZH5WKDTFJ9AHA.flexr-stx-token`
  const stx_token = `ST3J2GVMMM2R07ZFBJDWTYEYAR8FZH5WKDTFJ9AHA.stx-token`

  const public_key1 = Buffer.from('0208c2e3d1cadc11ae62c5a66131a45cf43d10979dfdee99195bcf401498ecf230', 'hex')

  before(async () => {
    ProviderRegistry.registerProvider(
      providerWithInitialAllocations(balances)
    )
    provider = await ProviderRegistry.createProvider()

    oracleClient = new OracleClient("ST3J2GVMMM2R07ZFBJDWTYEYAR8FZH5WKDTFJ9AHA", provider)
  })

  describe("Check contracts", () => {
    it("should have a valid syntax", async () => {
      await oracleClient.checkContract()
      await oracleClient.deployContract()
    })
  })

  describe("Full scenario", () => {
    before(async function() {
      // await oracleClient.verify()
      // await oracleClient.extractTimestamp()
      // await oracleClient.extractAmount()
      // await oracleClient.extractSymbol()

      this.timeout(20000)

      await oracleClient.addSource('source1', public_key1, {sender: zoe})
      await oracleClient.revokeSource('source1', {sender: zoe})

      // should fail
      try {
        await oracleClient.addSource('source1', public_key1, {sender: bob})
      } catch(e) {
        // console.log(e, typeof e, e instanceof Object, e instanceof NotOwnerError)
        if (e instanceof NotOwnerError) {
          assert(true)
        } else {
          assert(false, "did not throw NotOwnerError")
        }
      }

      // should fail
      try {
        await oracleClient.revokeSource('source1', {sender: bob})
      } catch(e) {
        if (e instanceof NotOwnerError) {
          assert(true)
        } else {
          assert(false, "did not throw NotOwnerError")
        }
      }

      // await oracleClient.addPrice(
      //   'coinbase',
      //   Buffer.from('000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000604bf84c00000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000d5b97cd500000000000000000000000000000000000000000000000000000000000000006707269636573000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000034254430000000000000000000000000000000000000000000000000000000000', 'hex'),
      //   Buffer.from('36ed38cb1e474166a10ff83571fbd29a829ca4e7a1765db32be4f72399cca50c147506a01590952a4665eb18585ca915e810d6aa02548eb5b58f060626c3877100', 'hex'),
      //   {sender: bob}
      // )
      // await oracleClient.addPrice(
      //   'coinbase',
      //   Buffer.from('000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000604bf84c00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000001a001cd8000000000000000000000000000000000000000000000000000000000000000670726963657300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004434f4d5000000000000000000000000000000000000000000000000000000000', 'hex'),
      //   Buffer.from('0d8aba242404fd657ed7b6b23e48d509cb709a5dc79b1b88214a3adc798db7fb4d7840670e7f2e1588599901d6c2c469e5f3eab3edef31012be594a4e9b963c001', 'hex'),
      //   {sender: bob}
      // )
      // await oracleClient.addPrice(
      //   'coinbase',
      //   Buffer.from('000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000604bf84c00000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000697c8c100000000000000000000000000000000000000000000000000000000000000006707269636573000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000034554480000000000000000000000000000000000000000000000000000000000', 'hex'),
      //   Buffer.from('0462b4e850cac4503cd64e5d6e7c544816bee4944b82acbf204f4e70929a9c933f76ae32c3a536e65a87e26b5ba624b9d5256adb5a7c8d308a8c4774d52b7db401', 'hex'),
      //   {sender: bob}
      // )
      // await oracleClient.addPrice(
      //   'coinbase',
      //   Buffer.from('000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000604bf84c00000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000001291106000000000000000000000000000000000000000000000000000000000000000670726963657300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003534e580000000000000000000000000000000000000000000000000000000000', 'hex'),
      //   Buffer.from('0c9309dc6b538295c271486bfd05a47491d9e6a66870d40952e80eed71a5b4d968e1bbc22a29f97120b4393a210641801dc5bdafbc8e69f196485b858ade565100', 'hex'),
      //   {sender: bob}
      // )

      // await oracleClient.addPrice(
      //   'okcoin',
      //   Buffer.from('000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000604d6f8800000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000e3800aaf00000000000000000000000000000000000000000000000000000000000000006707269636573000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000034254430000000000000000000000000000000000000000000000000000000000', 'hex'),
      //   Buffer.from('5f9455b5df933dd7901930655eab90a44dae334eb811b3b31098c6ec175480451235b88f65363d8f5a476035644663fb600b4ae50aec2d4e861a7132f6d3d11701', 'hex'),
      //   {sender: bob}
      // )
      // await oracleClient.addPrice(
      //   'okcoin',
      //   Buffer.from('000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000604d6f8800000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000718bfe400000000000000000000000000000000000000000000000000000000000000006707269636573000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000034554480000000000000000000000000000000000000000000000000000000000', 'hex'),
      //   Buffer.from('f1f8a3a72ce9ef6616b0eda58d712a22a6fdfe163a984eb013fa51aaf51936cf4ea25d6c4d6622d83b0c53ec91345c520bf518bc7047cf321bfcd82c7a1e79c100', 'hex'),
      //   {sender: bob}
      // )

      await oracleClient.addPrices(
        [
          {
            src: 'artifix-okcoin',
            msg: Buffer.from('000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000604bf84c00000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000001291106000000000000000000000000000000000000000000000000000000000000000670726963657300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003534e580000000000000000000000000000000000000000000000000000000000', 'hex'),
            sig: Buffer.from('880ebe9f3be76f10a12b7830e37b1a9210addad493d68be48b5512938f023a6c182ef7ed7072e1da7a7ab74e1ca4889f15804b6990014c6997d173c4065d77e000', 'hex'),
          }, {
            src: 'artifix-okcoin',
            msg: Buffer.from('000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000604bf84c00000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000d5b97cd500000000000000000000000000000000000000000000000000000000000000006707269636573000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000034254430000000000000000000000000000000000000000000000000000000000', 'hex'),
            sig: Buffer.from('eef50a834429b0d3c70a72ab16c63c48311b7693eba5a076d708a9469c34ee99591296197703d2498021cf83783c8322f5f66fbc8963cad4a34337e80358a00900', 'hex'),
          },
        ],
        {sender: bob}
      )

      const coinbase_oracle_feed = await retrieveCoinbaseOracleFeed()
      const okcoin_oracle_feed = await retrieveOKCoinOracleFeed()
      const binance_feed = await retrieveBinanceFeed()
      const okcoin_feed = await retrieveOKCoinFeed()

      const feed = coinbase_oracle_feed.concat(okcoin_oracle_feed.concat(binance_feed.concat(okcoin_feed)))
      // console.log("combined feed", feed)

      await oracleClient.addPrices(
        feed,
        {sender: bob}
      )


      const value1 = await oracleClient.getPrice('coinbase', 'BTC')
      console.log("coinbase.BTC", value1)

      const value2 = await oracleClient.getPrice('okcoin', 'BTC')
      console.log("okcoin.BTC", value2)

      const value3 = await oracleClient.getPrice('okcoin', 'STX')
      console.log("okcoin.STX", value3)

      const value4 = await oracleClient.getPrice('artifix-binance', 'STX-BTC')
      console.log("artifix-binance.STX-BTC", value4)

      const value5 = await oracleClient.getPrice('artifix-binance', 'STX-USDT')
      console.log("artifix-binance.STX-USDT", value5)

      const value6 = await oracleClient.getPrice('artifix-okcoin', 'STX-BTC')
      console.log("artifix-okcoin.STX-BTC", value6)

      const value7 = await oracleClient.getPrice('artifix-okcoin', 'STX')
      console.log("artifix-okcoin.STX", value7)

    })

    it("check balances after running scenario", async () => {
      // all tests are done in the before hook, but need a test to trigger it
    })

  })

  after(async () => {
    await provider.close()
  })
})
