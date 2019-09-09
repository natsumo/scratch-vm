const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const log = require('../../util/log');
const http = require("https");
var Url     = require("url");

var options = {};
// クエリ
var querys = {};
// APIキー
var applicationKey = '';
var clientKey = '';

// 取得データ
var results = {};

class Scratch3NewBlocks {
    constructor (runtime) {
        this.runtime = runtime;
    }

    getInfo () {
        return {
          id: 'newblocks',
          name: 'NCMB',
          blocks: [
                {
                    opcode: 'NCMBconfig_1',
                    blockType: BlockType.COMMAND,
                    text: 'アプリケーションキーの設定[APPLICATIONKEY]',
                    arguments: {
                        APPLICATIONKEY: {
                            type: ArgumentType.STRING,
                            defaultValue: "applicationKey"
                        }
                    }
                },
                {
                    opcode: 'NCMBconfig_2',
                    blockType: BlockType.COMMAND,
                    text: 'クライアントキーの設定[CLIENTKEY]',
                    arguments: {
                        CLIENTKEY: {
                            type: ArgumentType.STRING,
                            defaultValue: "clientKey"
                        }
                    }
                },
                {
                    opcode: 'saveData',
                    blockType: BlockType.COMMAND,
                    text: '【保存】[CLASSNAME]の[KEY]に値[VALUE]を保存する',
                    arguments: {
                        CLASSNAME: {
                            type: ArgumentType.STRING,
                            defaultValue: "className"
                        },
                        KEY: {
                            type: ArgumentType.STRING,
                            defaultValue: "key"
                        },
                        VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: "value"
                        }
                    }
                },
                {
                    opcode: 'fetchAllData',
                    blockType: BlockType.COMMAND,
                    text: '【取得】[CLASSNAME]のデータを全件取得する',
                    arguments: {
                        CLASSNAME: {
                            type: ArgumentType.STRING,
                            defaultValue: "className"
                        }
                    }
                },
                {
                    opcode: 'order',
                    blockType: BlockType.COMMAND,
                    text: '【検索条件】[KEY]の値でソート:[ORDER]',
                    arguments: {
                        KEY: {
                            type: ArgumentType.STRING,
                            defaultValue: "key"
                        },
                        ORDER: {
                            type: ArgumentType.STRING,
                            defaultValue: "upまたはdown"
                        }
                    }
                },
                {
                    opcode: 'limit',
                    blockType: BlockType.COMMAND,
                    text: '【検索条件】[NUM]件取得（1~1000）',
                    arguments: {
                        NUM: {
                            type: ArgumentType.STRING,
                            defaultValue: "number"
                        }
                    }
                },
                {
                    opcode: 'skip',
                    blockType: BlockType.COMMAND,
                    text: '【検索条件】[NUM]件目から取得',
                    arguments: {
                        NUM: {
                            type: ArgumentType.STRING,
                            defaultValue: "number"
                        }
                    }
                },
                {
                    opcode: 'equal',
                    blockType: BlockType.COMMAND,
                    text: '【検索条件】[KEY]の値が[VALUE]と等しい',
                    arguments: {
                        KEY: {
                            type: ArgumentType.STRING,
                            defaultValue: "key"
                        },
                        VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: "value"
                        }
                    }
                },
                {
                    opcode: 'valueCount',
                    blockType: BlockType.REPORTER,
                    text: '取得したデータ（配列）の数'
                },
                {
                    opcode: 'value',
                    blockType: BlockType.REPORTER,
                    text: '取得したデータ（配列）の[NUM]番目の[KEY]の値',
                    arguments: {
                        NUM: {
                            type: ArgumentType.NUMBER,
                            defaultValue: "number"
                        },
                        KEY: {
                            type: ArgumentType.STRING,
                            defaultValue: "key"
                        }
                    }
                }
            ],
            menus: {
            }
        };
    }

    NCMBconfig_1 (args) {
        applicationKey = Cast.toString(args.APPLICATIONKEY);
    }

    NCMBconfig_2 (args) {
        clientKey = Cast.toString(args.CLIENTKEY);
    }

    saveData (args) {
        const className = Cast.toString(args.CLASSNAME);
        const key = Cast.toString(args.KEY);
        const value = Cast.toString(args.VALUE);
        const method = 'POST';
        const opts = {};
        sendRequest(applicationKey, clientKey, className, method, opts);
        sendSaveRequest(options, key, value);
    }

    fetchAllData (args) {
        const className = Cast.toString(args.CLASSNAME);
        const method = 'GET';
        var opts = {};
        if (Object.keys(querys).length) {
          opts.query = querys;
        }
        console.log(JSON.stringify(opts));
        sendRequest(applicationKey, clientKey, className, method, opts);
        sendFetchAllRequest(options);
    }

    order (args) {
      const key = Cast.toString(args.KEY);
      const order = Cast.toString(args.ORDER);
      console.log(order);

      switch (order) {
        case 'up':
          querys.order = key;
          break;
        case 'down':
          querys.order = "-" + key;
          break;
        default:
          console.log('Error: upまたはdown以外は指定できません。');
          return;
      }

    }

    limit (args) {
      const num = Cast.toString(args.NUM);
      querys.limit = parseInt(num);
    }

    skip (args) {
      const num = Cast.toString(args.NUM);
      querys.skip = num-1;
    }

    equal (args) {
      const key = Cast.toString(args.KEY);
      const value = Cast.toString(args.VALUE);
      var str = '{"' + key + '":"' + value + '"}'
      querys.where = JSON.parse(str);
    }

    valueCount () {
      if (!Object.keys(results).length) {
        console.log('Error: 値がありません。');
        return;
      }

      var array = results.results;
      var counter = array.length;

      return counter;
    }

    value (args) {
      if (!Object.keys(results).length) {
        console.log('Error: 値がありません。');
        return;
      }
      var ans = '';
      var num = Cast.toString(args.NUM);
      var key = Cast.toString(args.KEY);
      var array = results.results;

      if (num < 0 || num > array.length) {
        ans = 'Error: ' + num + '件目のデータはありません。';
        console.log(ans);
      } else {
        num = num-1;
        var obj = array[num];
        ans = obj[key]
      }

      return ans;
    }

}

function sendRequest(applicationKey, clientKey, className, method, opts) {
  console.log(method);
    var opts = opts || {};
    var hostname = "mbaas.api.nifcloud.com";
    var className = className;
    var path = '/2013-09-01/classes/' + className;
    var timestamp = new Date().toISOString();
    var method = method;
    var apiKey = applicationKey;
    var clientKey = clientKey;

    var parsedUrl = Url.parse(path);
    parsedUrl.hostname = hostname;
    parsedUrl.port     = 443
    parsedUrl.protocol = 'https';
    var param_sig = {
        "url" : parsedUrl.format(),
        "method": method,
        "query" : opts.query || "",
        "timestamp" :timestamp,
        "signatureMethod" : opts.signatureMethod || "HmacSHA256",
        "signatureVersion" :opts.signatureVersion || 2,
        "fqdn" :opts.fqdn || hostname,
        "apikey": opts.apikey || apiKey,
        "clientkey" : opts.clientkey || clientKey
    };
    var sig = (this.createSignature || require("./signature").create)(
        param_sig.url,
        param_sig.method,
        param_sig.query ,
        param_sig.timestamp,
        param_sig.signatureMethod,
        param_sig.signatureVersion,
        param_sig.fqdn,
        param_sig.apikey,
        param_sig.clientkey
    );
    var headers = {
        "X-NCMB-Application-Key":    opts.apikey || apiKey,
        "X-NCMB-Signature":          sig,
        "X-NCMB-Timestamp":          timestamp,
        "X-NCMB-SDK-Version":        "javascript-3.0.0"
    };
    console.log(sig);

    var data = {};
    if ('query' in opts) {
      Object.keys(opts.query).forEach(function(key){
          var q = opts.query[key];
          if(typeof q === "object") {
              q = JSON.stringify(q);
          }
          data[key] = encodeURIComponent(q);
      });
    }

    if(Object.keys(data).length){
        path += "?" + Object.keys(data).sort().map(function(key){
            return [key, data[key]].join("=");
        }).join("&");
    }
    console.log(path);

    options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: method,
      headers: headers
    };
}

function sendSaveRequest(options, key, value) {
    var req = http.request(options, function(res) {
          console.log('Status: ' + res.statusCode);
          console.log('Headers: ' + JSON.stringify(res.headers));
          res.setEncoding('utf8');
          res.on('data', function (body) {
              console.log('Body: ' + body);
          });
        });
        req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });
    // write data to request body
    req.write('{"'+ key + '": "' + value + '"}');
    req.end();
}

function sendFetchAllRequest(options) {
  　// 前の結果を空に
    results = {};
    var req = http.request(options, function(res) {
          console.log('Status: ' + res.statusCode);
          console.log('Headers: ' + JSON.stringify(res.headers));
          res.setEncoding('utf8');
          res.on('data', function (body) {
              console.log('Body: ' + body);
              results = JSON.parse(body);
          });
        });
        req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });
    req.end();
    // クエリを空に
    query = {};
}

module.exports = Scratch3NewBlocks;
