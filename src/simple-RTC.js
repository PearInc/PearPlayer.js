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
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

inherits(SimpleRTC, EventEmitter);

function SimpleRTC(config) {
    EventEmitter.call(this);

    console.log('start simpleRTC');
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

    console.log('[pear_webrtc] event.type' + event.type);
    console.log('event JSON: ' + JSON.stringify(event));
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
        // console.log('err event.type: ' + JSON.stringify(event));
    }
};

SimpleRTC.prototype.createPeerConnect = function () {
    var self = this;

    try {
        this.peerConnection = new RTCPeerConnection(this.pc_config);
        // console.log('[simpleRTC] PeerConnection created!');
        if (this.config.initiator && this.config.initiator == true){
            console.log('[pear_webrtc]  sendOffer');
            this.sendOffer();

        }else {
            // createDatachannel();
        }
    }
    catch (e) {
        console.log("pc established error："+e.message);
        this.emit('error', e.message);
    }

    this.peerConnection.onopen = function() {
        console.log("PeerConnection established");

    };

    this.peerConnection.onicecandidate = function (event) {
        // console.log('[pear_webrtc] onicecandidate: ' + JSON.stringify(event));
        if (event.candidate == null) {
            if (self.sdp == "") {
                console.log("sdp error");
                self.emit('error', "sdp error");
                return;
            }
            return;
        } else {
            // socketSend(event.candidate);
            // console.log('[pear_webrtc] sendCandidate');
            self.emit('signal',event.candidate);
            if (!self.config.initiator || self.config.initiator == false){
                // createDatachannel();
            }
        }
        // console.log("iceGatheringState: "+ self.peerConnection.iceGatheringState);
    };

    this.peerConnection.oniceconnectionstatechange = function (evt) {

        console.log("connectionState: "+ self.peerConnection.connectionState);
        console.log("signalingstate:"+ self.peerConnection.signalingState);
        if (self.peerConnection.signalingState=="stable" && !self.isDataChannelCreating)
        {
            console.log('[pear_webrtc] oniceconnectionstatechange stable');
            self.createDatachannel();
            self.isDataChannelCreating = true;
        }


    };

    this.peerConnection.ondatachannel = function (evt) {
        self.dataChannel = evt.channel;
        console.log(this.dataChannel.label+"dc state: "+ self.dataChannel.readyState);
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
        console.log("Channel [ " + this.dataChannel.label + " ] creating!");
        console.log(this.dataChannel.label+" Datachannel state: "+ this.dataChannel.readyState);
    }
    catch (dce) {
        console.log("dc established error: "+dce.message);
        this.emit('error', dce.message);
    }

    this.dataChannelEvents(this.dataChannel);
};

SimpleRTC.prototype.dataChannelEvents = function (channel) {
    var self = this;

    channel.onopen = function () {
        console.log("Datachannel opened, current stateis :\n" + self.dataChannel.readyState);
        console.log(channel);
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
        console.log("DataChannel is closed");
    }
};

SimpleRTC.prototype.receiveOffer = function (evt) {
    var self = this;

    this.peerConnection.setRemoteDescription(new RTCSessionDescription(evt));
    console.log("Received Offer, and set as Remote Desc:\n"+ evt.sdp);
    this.peerConnection.createAnswer(function(desc) {
        self.peerConnection.setLocalDescription(desc);
        self.currentoffer = desc;
        self.sdp = desc.sdp;
        console.log("Create Answer, and set as Local Desc:\n"+JSON.stringify(desc));
        // socketSend(desc);
        self.emit('signal',desc);
    },function (err) {
        console.log(err);
    });
};

SimpleRTC.prototype.sendOffer = function () {

    this.peerConnection.createOffer(function (desc) {
        this.currentoffer = desc;
        console.log("Create an offer : \n"+JSON.stringify(desc));
        this.peerConnection.setLocalDescription(desc);
        console.log("Offer Set as Local Desc");
        // socketSend(desc);
        this.emit('signal', desc);
        this.sdp = desc.sdp;
        console.log("Send offer:\n"+JSON.stringify(this.sdp));
    },function(error) {
        console.log(error);
    });
};

SimpleRTC.prototype.receiveAnswer = function (answer) {

    console.log("Received remote Answer: \n"+JSON.stringify(answer));
    this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("already set remote desc, current ice gather state: "+ this.peerConnection.iceGatheringState);
};

SimpleRTC.prototype.receiveIceCandidate = function (evt) {

    if (evt) {
        console.log("Received and add candidate:\n"+JSON.stringify(evt));
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
        console.log("[pear_webrtc] send data：" + data);
    } catch (e){
        console.log("dataChannel send error："+e.message);
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
        console.log(JSON.stringify(heartbeat));
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


