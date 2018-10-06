'use strict';

const StellarSdk = require('stellar-sdk');
const StellarServer = new StellarSdk.Server('https://horizon.stellar.org');

const ASSETS = {
  XCN: new StellarSdk.Asset('XCN', "GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWSTQITS65M5RCNY"),
  IDOL: new StellarSdk.Asset('IDOL', "GCHMWSKQV6PFLI5NHQKJDR7P52SEM4Z6X4RGW7PMVDUBCFSSESTJ4J2L"),
  XYG: new StellarSdk.Asset('XYG', "GCCVQB3LQ6AH7AHV7DO5BUMB2H4KGG5274SLI3DE6HW5YHNU3QRLFEEJ"),
  BTC: new StellarSdk.Asset('BTC', "GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH"),
  ETH: new StellarSdk.Asset('ETH', "GBETHKBL5TCUTQ3JPDIYOZ5RDARTMHMEKIO2QZQ7IOZ4YC5XV3C2IKYU"),
  CNY: new StellarSdk.Asset('CNY', "GAREELUB43IRHWEASCFBLKHURCGMHE5IF6XSE7EXDLACYHGRHM43RFOX"),
  STM: new StellarSdk.Asset('STM', "GCMS2VO5ANJCESJBZVC3INFSETS3K4UWMU47W7KSQ2BYASEQAN4NUSTM"),
  XFF: new StellarSdk.Asset('XFF', "GAZEX2USUBMMWFRZFS77VDJYXUFLXI4ZGFPWX6TBNZCSTEQWNLFZMXFF"),
  XLM: StellarSdk.Asset.native()
}
const TRADE_PAIRS = [
  {
    to: ASSETS.XCN, // counter
    from: ASSETS.IDOL // base
  },
  {
    to: ASSETS.XLM,
    from: ASSETS.IDOL
  },
  {
    to: ASSETS.XLM,
    from: ASSETS.XYG
  },
  {
    to: ASSETS.XCN,
    from: ASSETS.XYG
  },
  {
    to: ASSETS.XCN,
    from: ASSETS.XLM
  },
  {
    to: ASSETS.XCN,
    from: ASSETS.BTC
  },
  {
    to: ASSETS.XCN,
    from: ASSETS.ETH
  },
]

const Hapi = require('hapi');
const server = Hapi.server({
    port: 8877,
});

server.route({
  method: 'GET',
  path: '/',
  handler: (request, h) => {
    return 'Hello, IDOL!';
  }
});

server.route({
  method: 'GET',
  path: '/v2/api/trade_aggregations',
  handler: (request, h) => {
    let timeout = 5000
    if (request.query.r) {
      timeout = request.query.r
    }
    const allPromises = []
    TRADE_PAIRS.forEach(pair => {
      allPromises.push(
        StellarServer
          .tradeAggregation(pair.from, pair.to, null, null, 3600000)
          .limit(1)
          .order('desc')
          .call()
          .then(res => {
            return {type: 'trade_aggregation', pair: pair, records: res.records}
          })
      )
      allPromises.push(
        StellarServer
          .trades()
          .forAssetPair(pair.from, pair.to)
          .order('desc')
          .limit(1)
          .call()
          .then(res => {
            return {type: 'trades', pair: pair, records: res.records}
          })
      )
    })
    return Promise.all(allPromises).then(resp => {
      const tradeDicts = []
      resp.forEach(res => {
        if (res.type === 'trades') {
          if (res.records.length > 0) {
            tradeDicts.push(res.records[0])
          }
        }
      })

      const allResp = {XCN:[]}
      resp.forEach(result => {
        if (result.type === 'trades') return
        const pair = result.pair
        const records = result.records
        const tmp = {}
        if (pair.from.isNative()) {
          tmp['base_asset'] = {
            'code': pair.from.code,
            'issuer': null
          }
        } else {
          tmp['base_asset'] = {
            'code': pair.from.code,
            'issuer': pair.from.issuer
          }
        }
        if (pair.to.isNative()) {
          tmp['counter_asset'] = {
            'code': pair.to.code,
            'issuer': null
          }
        } else {
          tmp['counter_asset'] = {
            'code': pair.to.code,
            'issuer': pair.to.issuer
          }
        }

        if (records.length > 0) {
          tmp['stat'] = {
            "low": records[0].low,
            "base_volume": records[0].base_volume,
            "close": records[0].close,
            "order_book_avg": records[0].avg,
            "counter_volume": records[0].counter_volume,
            "high": records[0].high,
            "open": records[0].open
          }
          tradeDicts.forEach(trade => {
            if (pair.from.isNative()) {
              if (trade.base_asset_type === 'native' && trade.counter_asset_code === pair.to.code && trade.counter_asset_issuer === pair.to.issuer) {
                tmp['stat']['latest_price_xcn'] = trade.price.n / trade.price.d
                tmp['stat']['latest_price'] = trade.price.n / trade.price.d
              }
            } else if (pair.to.isNative()) {
              if (trade.counter_asset_type === 'native' && trade.base_asset_code === pair.from.code && trade.base_asset_issuer === pair.from.issuer) {
                tmp['stat']['latest_price_xcn'] = trade.price.n / trade.price.d
                tmp['stat']['latest_price'] = trade.price.n / trade.price.d
              }
            } else {
              if (trade.counter_asset_code === pair.to.code && trade.counter_asset_issuer === pair.to.issuer && trade.base_asset_code === pair.from.code && trade.base_asset_issuer === pair.from.issuer) {
                tmp['stat']['latest_price_xcn'] = trade.price.n / trade.price.d
                tmp['stat']['latest_price'] = trade.price.n / trade.price.d
              }
            }
          })

        } else {
          tmp['stat'] = {
            "latest_price_xcn": "0",
            "low": "0",
            "base_volume": "0",
            "close": "0",
            "order_book_avg": "0",
            "latest_price": "0",
            "counter_volume": "0",
            "high": "0",
            "open": "0"
          }
        }
        if (allResp[pair.to.code] == undefined) {
          allResp[pair.to.code] = []
        }
        allResp[pair.to.code].push(tmp)
      })
      return allResp
    })
    .catch(err => {
      return err
    })

    // StellarServer.trades()
    //   .forAssetPair(baseAsset, counterAsset)
    //   .limit(1)
    //   .order('desc')
    //   .call()
    //   .then(r => {
    //     console.log('trades', r.records[0].price)
    //   })
    //   .catch(err => {
    //     console.log(err)
    //   })

  }
});

const init = async () => {
  await server.start();
  console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
