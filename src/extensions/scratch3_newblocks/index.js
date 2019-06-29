const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const log = require('../../util/log');
const http = require("https");
var Url     = require("url");

class Scratch3NewBlocks {
    constructor (runtime) {
        this.runtime = runtime;
    }

    getInfo () {
        return {
            id: 'newblocks',
            name: 'New Blocks',
            blocks: [
                {
                    opcode: 'writeLog',
                    blockType: BlockType.COMMAND,
                    text: 'log [TEXT]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: "hello"
                        }
                    }
                }
            ],
            menus: {
            }
        };
    }

    writeLog (args) {
        const text = Cast.toString(args.TEXT);
        log.log(text);

        sendRequest();
    }
}

function sendRequest() {
    var opts = {};
    var hostname = "mbaas.api.nifcloud.com";
    var path = '/2013-09-01/classes/TestClass'
    var timestamp = new Date().toISOString();
    var method = "POST";
    // var apiKey = "YOUR-APPLICATION-KEY";
    // var clientKey = "YOUR-CLIENT-KEY";
    var apiKey = "d7210a1e99e10032fd24086555748bafd42f3a077d9aee793839047c7740afdb";
    var clientKey = "cf91a7cb1e4e7be951a9b0b2a45daf8e605befc6eabf506defa73ef55378287e";

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

    var options = {
    hostname: hostname,
    port: 443,
    path: path,
    method: method,
    headers: headers
    };
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
    req.write('{"msg": "Hello World"}');
    req.end()
}

module.exports = Scratch3NewBlocks;
