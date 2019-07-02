const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const log = require('../../util/log');
const http = require("https");
var Url     = require("url");
var options = {};

class Scratch3NewBlocks {
    constructor (runtime) {
        this.runtime = runtime;
    }

    getInfo () {
        return {
          id: 'newblocks',
          name: 'NCMB Blocks',
          blocks: [
                {
                    opcode: 'NCMBconfig',
                    blockType: BlockType.COMMAND,
                    text: 'API KEY [APPLICATIONKEY], [CLIENTKEY]',
                    arguments: {
                        APPLICATIONKEY: {
                            type: ArgumentType.STRING,
                            defaultValue: "applicationKey"
                        },
                        CLIENTKEY: {
                            type: ArgumentType.STRING,
                            defaultValue: "clientKey"
                        }
                    }
                },
                {
                    opcode: 'saveData',
                    blockType: BlockType.COMMAND,
                    text: 'saveData [KEY], [VALUE]',
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
                }
            ],
            menus: {
            }
        };
    }

    NCMBconfig (args) {
        const applicationKey = Cast.toString(args.APPLICATIONKEY);
        const clientKey = Cast.toString(args.CLIENTKEY);
        sendRequest(applicationKey, clientKey);
    }

    saveData (args) {
        const key = Cast.toString(args.KEY);
        const value = Cast.toString(args.VALUE);
        sendSaveRequest(options, key, value)
    }
}

function sendRequest(applicationKey, clientKey) {
    var opts = {};
    var hostname = "mbaas.api.nifcloud.com";
    var path = '/2013-09-01/classes/Scratch'
    var timestamp = new Date().toISOString();
    var method = "POST";
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
    req.end()
}

module.exports = Scratch3NewBlocks;
