/**
 * Created by snow on 17-6-19.
 */

/*
 config:{
 initiator : Boolean      //true主动发送offer
 stunServers: Array       //stun服务器数组
 }
 */

module.exports = SimpleRTC;

var debug = require('debug')('pear:simple-RTC');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

inherits(SimpleRTC, EventEmitter);

function SimpleRTC(config) {
    EventEmitter.call(this);

    debug('start simpleRTC');
    var self = this;
    self.config = config || {};

    var wrtc = getBrowserRTC();

    self.RTCPeerConnection = wrtc.RTCPeerConnection;
    self.RTCSessionDescription = wrtc.RTCSessionDescription;
    self.RTCIceCandidate = wrtc.RTCIceCandidate;
    self.dataChannel = null;
    self.peerConnection = null;
    self.currentoffer = null;
    self.sdp = "";

    self.isDataChannelCreating = false;
    self.iceServers = [ {url:'stun:stun.miwifi.com'},{url:'stun:stun.ekiga.net'},{url:'stun:stun.ideasip.com'}];
    self.pc_config = {
        iceServers: self.iceServers
    };

    self.createPeerConnect();
}

SimpleRTC.prototype.signal = function (event) {

    debug('[pear_webrtc] event.type' + event.type);
    debug('event JSON: ' + JSON.stringify(event));
    if (event.type === 'offer') {
        this.receiveOffer(event);
    } else if (event.type === 'answer') {
        this.receiveAnswer(event);
    }
    // else if (event.type === 'candidate') {
    //     ReceiveIceCandidate(event);
    // }
    else {
        this.receiveIceCandidate(event);
        // debug('err event.type: ' + JSON.stringify(event));
    }
};

SimpleRTC.prototype.createPeerConnect = function () {
    var self = this;

    try {
        this.peerConnection = new RTCPeerConnection(this.pc_config);
        // debug('[simpleRTC] PeerConnection created!');
        if (this.config.initiator && this.config.initiator == true){
            debug('[pear_webrtc]  sendOffer');
            this.sendOffer();

        }else {
            // createDatachannel();
        }
    }
    catch (e) {
        debug("pc established error："+e.message);
        this.emit('error', e.message);
    }

    this.peerConnection.onopen = function() {
        debug("PeerConnection established");

    };

    this.peerConnection.onicecandidate = function (event) {
        // debug('[pear_webrtc] onicecandidate: ' + JSON.stringify(event));
        if (event.candidate == null) {
            if (self.sdp == "") {
                debug("sdp error");
                self.emit('error', "sdp error");
                return;
            }
            return;
        } else {
            // socketSend(event.candidate);
            // debug('[pear_webrtc] sendCandidate');
            self.emit('signal',event.candidate);
            if (!self.config.initiator || self.config.initiator == false){
                // createDatachannel();
            }
        }
        // debug("iceGatheringState: "+ self.peerConnection.iceGatheringState);
    };

    this.peerConnection.oniceconnectionstatechange = function (evt) {

        debug("connectionState: "+ self.peerConnection.connectionState);
        debug("signalingstate:"+ self.peerConnection.signalingState);
        if (self.peerConnection.signalingState=="stable" && !self.isDataChannelCreating)
        {
            debug('[pear_webrtc] oniceconnectionstatechange stable');
            self.createDatachannel();
            self.isDataChannelCreating = true;
        }


    };

    this.peerConnection.ondatachannel = function (evt) {
        self.dataChannel = evt.channel;
        debug(this.dataChannel.label+"dc state: "+ self.dataChannel.readyState);
        self.dataChannelEvents(this.dataChannel);
    };

    this.peerConnection.onicegatheringstatechange = function() {
        if (self.peerConnection.iceGatheringState === 'complete') {
            self.emit('signal', {
                "candidate":"completed"
            });
        }
    }
};

SimpleRTC.prototype.createDatachannel = function () {

    try {
        this.dataChannel = this.peerConnection.createDataChannel('dataChannel', {reliable: true});
        debug("Channel [ " + this.dataChannel.label + " ] creating!");
        debug(this.dataChannel.label+" Datachannel state: "+ this.dataChannel.readyState);
    }
    catch (dce) {
        debug("dc established error: "+dce.message);
        this.emit('error', dce.message);
    }

    this.dataChannelEvents(this.dataChannel);
};

SimpleRTC.prototype.dataChannelEvents = function (channel) {
    var self = this;

    channel.onopen = function () {
        debug("Datachannel opened, current stateis :\n" + self.dataChannel.readyState);
        debug(channel);
        self.emit('connect', self.dataChannel.readyState);
    };

    channel.onmessage = function (event) {

        var data = event.data;
        if (data instanceof Blob) {                       //兼容firefox 将返回的Blob类型转为ArrayBuffer
            var fileReader = new FileReader();
            fileReader.onload = function() {
                // arrayBuffer = this.result;
                self.emit('data', this.result);
            };
            fileReader.readAsArrayBuffer(data);
        } else {
            self.emit('data', data);
        }
    };

    channel.onerror = function (err) {
        self.emit('error', err);
    };

    channel.onclose = function () {
        debug("DataChannel is closed");
        clearInterval(self.timer);
        self.timer = null;
    }
};

SimpleRTC.prototype.receiveOffer = function (evt) {
    var self = this;

    this.peerConnection.setRemoteDescription(new RTCSessionDescription(evt));
    // debug("Received Offer, and set as Remote Desc:\n"+ evt.sdp);
    this.peerConnection.createAnswer(function(desc) {
        self.peerConnection.setLocalDescription(desc);
        self.currentoffer = desc;
        self.sdp = desc.sdp;
        // debug("Create Answer, and set as Local Desc:\n"+JSON.stringify(desc));
        // socketSend(desc);
        self.emit('signal',desc);
    },function (err) {
        debug(err);
    });
};

SimpleRTC.prototype.sendOffer = function () {

    this.peerConnection.createOffer(function (desc) {
        this.currentoffer = desc;
        debug("Create an offer : \n"+JSON.stringify(desc));
        this.peerConnection.setLocalDescription(desc);
        debug("Offer Set as Local Desc");
        // socketSend(desc);
        this.emit('signal', desc);
        this.sdp = desc.sdp;
        debug("Send offer:\n"+JSON.stringify(this.sdp));
    },function(error) {
        debug(error);
    });
};

SimpleRTC.prototype.receiveAnswer = function (answer) {

    debug("Received remote Answer: \n"+JSON.stringify(answer));
    this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    debug("already set remote desc, current ice gather state: "+ this.peerConnection.iceGatheringState);
};

SimpleRTC.prototype.receiveIceCandidate = function (evt) {

    if (evt) {
        debug("Received and add candidate:\n"+JSON.stringify(evt));
        this.peerConnection.addIceCandidate(new RTCIceCandidate(evt));
    } else{
        return;
    }
};

SimpleRTC.prototype.connect = function () {

    this.createDatachannel();
};

SimpleRTC.prototype.send = function (data) {

    try {
        this.dataChannel.send(data);
        debug("[pear_webrtc] send data：" + data);
    } catch (e){
        debug("dataChannel send error："+e.message);
    }
};

SimpleRTC.prototype.close = function () {

    if (this.peerConnection){
        this.peerConnection.close();
        clearInterval(this.timer);
    }
};

SimpleRTC.prototype.startHeartbeat = function () {
    var self = this;
    var heartbeat = {
        action: 'ping'
    };

    this.timer = setInterval(function () {
        debug(JSON.stringify(heartbeat));
        self.send(JSON.stringify(heartbeat));

    }, 90*1000);
};


function getBrowserRTC () {
    if (typeof window === 'undefined') return null;
    var wrtc = {
        RTCPeerConnection: window.RTCPeerConnection || window.mozRTCPeerConnection ||
        window.webkitRTCPeerConnection,
        RTCSessionDescription: window.RTCSessionDescription ||
        window.mozRTCSessionDescription || window.webkitRTCSessionDescription,
        RTCIceCandidate: window.RTCIceCandidate || window.mozRTCIceCandidate ||
        window.webkitRTCIceCandidate
    };
    if (!wrtc.RTCPeerConnection) return null;
    return wrtc
}


