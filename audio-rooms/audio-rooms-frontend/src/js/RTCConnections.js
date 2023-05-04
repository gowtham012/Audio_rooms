

export class RTCConnection {
  constructor(myName, roomId, peersRef, wsSenderFn, peerAudioTrackHandlerFn, peerConnectionChangeFn) {
    this.myName = myName;
    this.roomId = roomId;
    this.peersRef = peersRef;
    this.wsSenderFn = wsSenderFn;
    this.peerAudioTrackHandlerFn = peerAudioTrackHandlerFn;
    this.peerConnectionChangeFn = peerConnectionChangeFn;
  }

  init(myId, iceServers, streamRef) {
    this.myId = myId;
    this.iceServers = iceServers;
    this.streamRef = streamRef;
  }

   addPeerToList = async (peerId, peerName, polite) => {
    console.log('adding ', peerId, ' to peers list')
    this.peersRef.current[peerId] = {
      id: peerId,
      name: peerName,
      polite: polite,
    }
    await this.initNewRTCPeerConn(peerId);
  }

  addPeerToListIfMissing = async (peerId, peerName) => {
    if (peerId in this.peersRef.current) {
      console.log(peerId, ' already present in peers list')
    } else {
      await this.addPeerToList(peerId, peerName, true)
    }
  }

   sendOfferMsgGivenOffer = async (peerId, offerSdp) => {
    let offerMsg = {
      type: "OFFER_SDP",
      room_id: this.roomId,
      to_member_id: peerId,
      to_member_name: this.peersRef.current[peerId].name,
      from_member_id: this.myId.current,
      from_member_name: this.myName
    }

    await this.peersRef.current[peerId].conn.setLocalDescription(offerSdp);
    offerMsg.offer_sdp = JSON.stringify(this.peersRef.current[peerId].conn.localDescription)
     console.log("sending offer ws message to ", peerId);
    this.wsSenderFn(JSON.stringify(offerMsg))
  };

  sendOfferMsg = async (peerId) => {
    const offer = await this.peersRef.current[peerId].conn.createOffer({
      offerToReceiveAudio: true, offerToReceiveVideo: false
    });
    return await this.sendOfferMsgGivenOffer(peerId, offer)
  };

  onOfferSdpFromPeer = async (peerId, peerName, sdp) => {
    await this.addPeerToListIfMissing(peerId, peerName)
    if (this.peersRef.current[peerId].conn.signalingState !== "stable") {
      console.log('signalling state is not stable. checking for polite/impolite')
      if (!this.peersRef.current[peerId].polite) {
        console.log('not a polite peer. ignoring')
        return
      } else {
        console.log('polite peer. rollback local description')
      }
      await Promise.all([
        this.peersRef.current[peerId].conn.setLocalDescription({type: "rollback"}),
        this.peersRef.current[peerId].conn.setRemoteDescription(sdp)
      ]);
    } else {
      await this.peersRef.current[peerId].conn.setRemoteDescription(sdp)
    }

    await this.peersRef.current[peerId].conn.setLocalDescription(await this.peersRef.current[peerId].conn.createAnswer({
      offerToReceiveAudio: true, offerToReceiveVideo: false
    }));

    let answerSdpWsMessage = {
      type: "ANSWER_SDP",
      room_id: this.roomId,
      to_member_id: peerId,
      to_member_name: this.peersRef.current[peerId].name,
      from_member_id: this.myId.current,
      from_member_name: this.myName
    }
    answerSdpWsMessage.answer_sdp = JSON.stringify(this.peersRef.current[peerId].conn.localDescription)
    this.wsSenderFn(JSON.stringify(answerSdpWsMessage))
  };

  onAnswerSdpFromPeer = async (peerId, peerName, sdp) => {
    await this.addPeerToListIfMissing(peerId, peerName);
    await this.peersRef.current[peerId].conn.setRemoteDescription(sdp);
    console.log("set remote description of ", peerId)
  };

  onIceCandidateFromPeer = async(peerId, peerName, ice_candidate) => {
    if (ice_candidate) {
      await this.addPeerToListIfMissing(peerId, peerName);
      await this.peersRef.current[peerId].conn.addIceCandidate(ice_candidate)
      console.log('added ice candidate from ', peerId, ' in rtcPeerConnection')
    }
  };

  newRTCPeerConnection = async (peerId) => {
    console.log('creating new rtc peer connection for ', peerId)
    const _pc = new RTCPeerConnection(this.iceServers)

    _pc.onicecandidateerror = (e) => {
      console.log('on ice candidate error', e)
    }

    _pc.onicegatheringstatechange = (e) => {
      console.log('ice gathering statechange', _pc.iceGatheringState, ' for ', peerId)
    }

    _pc.onsignalingstatechange = (e) => {
      console.log('signaling state changed to ', _pc.signalingState, ' for ', peerId)
    }

    _pc.oniceconnectionstatechange = (e) => {
      console.log("ice connection state changed to: ", _pc.iceConnectionState, ' for ', peerId)
    }

    _pc.onconnectionstatechange = async (e) => {
      console.log("rtc peer connection state changed to ", _pc.connectionState, ' for ', peerId)
      await this.peerConnectionChangeFn(peerId, _pc.connectionState)
    }

    return _pc;
  };

  initNewRTCPeerConn = async (peerId) => {
    this.peersRef.current[peerId].conn = await this.newRTCPeerConnection(peerId);

    this.peersRef.current[peerId].conn.onicecandidate = async (e) => {
      console.log('on ice candidate', e)
      if (e.candidate) {
        let iceCandidatesWsMsg = {
          type: "ICE_CANDIDATES",
          room_id: this.roomId,
          from_member_id: this.myId.current,
          from_member_name: this.myName,
          to_member_id: peerId,
          to_member_name: this.peersRef.current[peerId].name,
          ice_candidate: JSON.stringify(e.candidate.toJSON())
        }
        console.log("sending ice candidate to ", peerId)
        this.wsSenderFn(JSON.stringify(iceCandidatesWsMsg))
      }
    };

    this.peersRef.current[peerId].conn.onnegotiationneeded = async (e) => {
      console.log("received negotiation needed event with peer ", peerId);
      const offer = await this.peersRef.current[peerId].conn.createOffer({offerToReceiveAudio: true, offerToReceiveVideo: false})
      console.log("current signalling state is ", this.peersRef.current[peerId].conn.signalingState);
      if (this.peersRef.current[peerId].conn.signalingState !== "stable") {
        console.log("created offer for ", peerId, ' but not sending as state is not stable')
        return;
      }
      console.log('sending offer for ', peerId)
      await this.sendOfferMsgGivenOffer(peerId, offer)
    }

    this.peersRef.current[peerId].conn.ontrack = (e) => {
      console.log("received track from ", peerId)
      this.peerAudioTrackHandlerFn(peerId, e.streams[0])
    }

    await this.addTrackToPeerGivenStream(peerId, await this.getCurrentStream());
  };

  addTrackToAllPeers = async () => {
    console.log("adding tracks of all peers");
    const stream = await this.getCurrentStream();
    for (const [peerId, peer] of Object.entries(this.peersRef.current)) {
      await this.addTrackToPeerGivenStream(peerId, stream);
    }
  }

  updateTracksOfAllPeers = async () => {
    console.log("updating tracks of all peers");
    await this.removeTrackFromAllPeers();
    await this.addTrackToAllPeers();
  }

  removeTrackFromAllPeers = async () => {
    console.log("removing tracks from all peers");

    for (const [peerId] of Object.entries(this.peersRef.current)) {
      console.log("removing track from ", peerId);
      const senders = this.peersRef.current[peerId].conn.getSenders();
      for (const sender of senders) {
        this.peersRef.current[peerId].conn.removeTrack(sender);
      }
    }
  }

  addTrackToPeerGivenStream = async (peerId, stream) => {
    console.log("sending track to ", peerId);
    for (const track of stream.getTracks()) {
      this.peersRef.current[peerId].conn.addTrack(track, stream);
    }
  }

  getCurrentStream = async () => {
    return this.streamRef.current;
  }
}
