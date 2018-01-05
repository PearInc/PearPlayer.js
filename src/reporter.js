/**
 * Created by xieting on 2017/12/7.
 */

var debug = require('debug')('pear:reporter');
var axios = require('axios');

axios.defaults.baseURL = 'https://statdapi.webrtc.win:9801';

var abilitiesURL = 'https://api.webrtc.win/v2/customer/stats/nodes/capacity';


var totalReportTraffic = 0;

function reportTraffic(uuid, fileSize, traffics) {
    var temp = 0;
    for (var i=0; i<traffics.length; ++i) {
        temp += traffics[i].traffic;
    }
    if (temp >= totalReportTraffic + 10485760) {             //如果流量增加大于10
        var body = {
            uuid: uuid,
            size: Number(fileSize),
            traffic: traffics
        };
        axios({
            method: 'post',
            url: '/traffic',
            data: body
        })
        .then(function(response) {
            // debug('reportTraffic response:'+JSON.stringify(response)+' temp:'+temp+' totalReportTraffic:'+totalReportTraffic);
            if (response.status == 200) {
                totalReportTraffic = temp;
            }
        });
    }
}

function finalyReportTraffic(uuid, fileSize, traffics) {
    var body = {
        uuid: uuid,
        size: Number(fileSize),
        traffic: traffics
    };
    axios({
        method: 'post',
        url: '/traffic',
        data: body
    })
    .then(function(response) {
        if (response.status == 200) {
            debug('finalyReportTraffic');
        }
    });
}

function reportAbilities(abilities) {
    var benchmark = 0;
    for (var mac in abilities) {
        benchmark += abilities[mac];
    }
    benchmark = benchmark/Object.getOwnPropertyNames(abilities).length;
    var normalizeAbilities = {};
    for (var mac in abilities) {
        normalizeAbilities[mac] = abilities[mac]/benchmark*5;
        console.log('reportAbilities mac:'+mac+' ability:'+normalizeAbilities[mac]);
    }
    axios({
        method: 'post',
        url: abilitiesURL,
        data: normalizeAbilities
    })
    .then(function(response) {
        debug('reportAbilities response:'+JSON.stringify(response));
    });
}

module.exports = {

    reportTraffic : reportTraffic,
    finalyReportTraffic: finalyReportTraffic,
    reportAbilities: reportAbilities
};



