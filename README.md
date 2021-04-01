# stacks-open-oracle

## Introduction
While waiting for a more distributed solution (Where are you Chainlink?), this provides authenticated feeds (i.e. only the entity with the private key that matches the public key can generate that feed, but you have to trust that entity).  If enough other people also upload their feeds, then we can add a layer on top this to aggregate prices, and minimize some feeds misbehaving.

When calling addPrices, the contract will verify that the signature matches the public key for that source, so prices can be retrieved very quickly.  Anyone can call addPrices, but the source and public key should verify, and the timestamp needs to be later than the existing value


When a pair has one symbol, the price is against USD, otherwise, againt the second symbol (for example, Binance does not have USD pairs, only USDT or other stable coins)


## Feeds

### Coinbase open oracle feed
doc at: https://docs.pro.coinbase.com/#oracle, api key required, sadly

Pairs: BTC, ETH, LINK, COMP, UNI, SNX

Eth address: `0xfCEAdAFab14d46e20144F48824d0C09B1a03F2BC`

Compressed public key usable in Clarity: `0x034170a2083dccbc2be253885a8d0e9f7ce859eb370d0c5cae3b6994af4cb9d666`

### OKCoin open oracle feed
A feed provided at https://www.okcoin.com/api/market/v3/oracle

Pairs: BTC, ETH

Eth address: `0x419c555b739212684432050b7ce459ea8e7b8bda`

Compressed public key usable in Clarity: `0x0325df290b8c4930adcf8cd5c883616a1204ccc3d6ba3c4a636d6bcecd08e466d3`

### ArtifiX OKCoin feed
A feed pulled from OKCoin, and signed by one of my keys

Pairs: BTC, ETH, LINK, STX-BTC, STX, COMP, LTC, UNI

Public key: `0x03743bf7b397e38eb2474f8a9554471c9394ef23cc8f927351f3a6d882cbbe7a12`  (TODO(psq): change to deployment address)

### ArtifiX Binance feed
A feed pulled from Binance, and signed by one of my keys

Pairs: ETH-BTC, LINK-BTC, LINK-ETH, STX-BTC, STX-USDT, COMP-BTC, LTC-BTC, UNI-BTC, AAVE-BTC, SUSHI-BTC

Public key: `0x03743bf7b397e38eb2474f8a9554471c9394ef23cc8f927351f3a6d882cbbe7a12`  (TODO(psq): change to deployment address)

## Retrieving prices
Call `get-price`, for example:
```
(get-price "coinbase" "BTC")
```

Add your own feed (ping @psq on discord and I can add your source public key), or you can fork this repo and deploy your own contract (make sure you change the owner key)

## Deployment
The first version of the contract is deployed on mainnet at SPZ0RAC1EFTH949T4W2SYY6YBHJRMAF4ECT5A7DD.oracle-v1

Deploying this early so I can figure out what it takes to reliably upload prices, hopefully every blocks, and hopefully the transactions won't be too big for miners to process...


## Credits
Extra credits to @jcnelson for sharing an approach to manipulate buffers (https://gist.github.com/jcnelson/76c44b4209c29a19d2dbc06a0e7b446e)
