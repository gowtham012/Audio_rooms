import './App.css';
import {useEffect, useRef, useState} from "react";

const wsUrl = "ws://localhost:8080/join"

function App() {
  const audioRef = useRef()
  const wsRef = useRef()
  const roomRef = useRef("TSJAVja3HEp0xehuDitBq")

  const peersRef = useRef({})
  const myDetails = useRef({})

  const myId = useRef("yet to receive")
  const myName = useRef("member")
  const [name, setName] = useState("member")

  const [remoteAudioStreams, setRemoteAudioStreams] = useState({});
  const [streamsCount, setStreamsCount] = useState(0);

  const addMedia = () => {
    const constraints = {
      audio: true,
      video: false,
    }
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      console.log("received stream: ", stream)
      sendStreamToAll(stream)
    }).catch(e => {
      console.log("error in navigating media stream", e);
    })
  }

  const sendStreamToAll = (stream) => {
    for (const [peerId, peer] of Object.entries(peersRef.current)) {
      console.log('sending stream to ', peerId);
      for (const track of stream.getTracks()) {
        peer.conn.addTrack(track, stream)
      }
      console.log("sent track to ", peerId)
    }
  };

  const getRTCPeerConnection = (peerId) => {
    console.log('creating new rtc peer connection for ', peerId)
    const _pc = new RTCPeerConnection()

    _pc.onicecandidateerror = (e) => {
      console.log('on icecandidateerror', e)
    }

    _pc.onicegatheringstatechange = (e) => {
      console.log('on icegatheringstatechange', e)
    }

    _pc.onsignalingstatechange = (e) => {
      console.log('on signalingstatechange', e)
    }

    _pc.oniceconnectionstatechange = (e) => {
      console.log("on iceconnection state change: ", e)
    }

    _pc.onconnectionstatechange = (e) => {
      console.log("rtc peer connection state changed", e)
    }
    return _pc;
  }

  const buildJoinRequest = async (roomId) => {
    return
  };

  const createWsConn = () => {
    let _ws = new WebSocket(wsUrl)

    _ws.onopen = () => {
      console.log("conn got opened");
    }

    _ws.onclose = () => {
      console.log("conn got closed");
    }

    _ws.onerror = (e) => {
      console.log("error on socket", e);
    }

    _ws.onmessage = (e) => {
      console.log("message received on socket", e);
      handleWsMessage(e.data)
    }

    wsRef.current = _ws
  }

  const joinRoom = async () => {
    const joinReqMsg = await buildJoinRequest(roomRef.current)
    wsRef.current.send(joinReqMsg)
  }

  const addPeerToList = async (msg, polite) => {
    let peerId = msg.from_member_id
    let peerName = msg.from_member_name
    console.log('adding ', peerId, ' to peers list')

    peersRef.current[peerId] = {
      id: peerId,
      name: peerName,
      polite: polite,
    }
    await initNewRTCPeerConn(peerId);
  }

  const addPeerToListIfMissing = async (msg) => {
    let peerId = msg.from_member_id
    if (peerId in peersRef.current) {
      console.log(peerId, ' already present in peers list')
    } else {
      await addPeerToList(msg, true)
    }
  }

  async function sendOfferMsgGivenOffer(peerId, offerSdp) {
    let offerMsg = {
      type: "OFFER_SDP",
      room_id: roomRef.current,
      to_member_id: peerId,
      to_member_name: peersRef.current[peerId].name,
      from_member_id: myId.current,
      from_member_name: myName.current
    }

    await peersRef.current[peerId].conn.setLocalDescription(offerSdp);
    offerMsg.offer_sdp = JSON.stringify(peersRef.current[peerId].conn.localDescription)
    wsRef.current.send(JSON.stringify(offerMsg))
  }

  async function sendOfferMsg(peerId) {
    const offer = await peersRef.current[peerId].conn.createOffer({
      offerToReceiveAudio: true, offerToReceiveVideo: false
    });
    sendOfferMsgGivenOffer(peerId, offer)
  }

  const handleWsMessage = async (data) => {
    const msg = JSON.parse(data)
    console.log("type: ", msg.type, ", message: ", msg)

    if (msg.type === "OFFER_MESSAGE_REQUEST") {
      await addPeerToList(msg, false)
      await sendOfferMsg(msg.from_member_id);
    } else if (msg.type === "OFFER_SDP") {
      addPeerToListIfMissing(msg)
      let peerId = msg.from_member_id
      console.log('received offer from ', peerId)
      let sdp = JSON.parse(msg.offer_sdp)
      if (peersRef.current[peerId].conn.signalingState !== "stable") {
        console.log('signalling state is not stable. checking for polite/impolite')
        if (!peersRef.current[peerId].polite) {
          console.log('not a polite peer. ignoring')
          return
        } else {
          console.log('polite peer. rollback local description')
        }
        await Promise.all([
          peersRef.current[peerId].conn.setLocalDescription({type: "rollback"}),
          peersRef.current[peerId].conn.setRemoteDescription(sdp)
        ]);
      } else {
        await peersRef.current[peerId].conn.setRemoteDescription(sdp)
      }

      await peersRef.current[peerId].conn.setLocalDescription(await peersRef.current[peerId].conn.createAnswer({
        offerToReceiveAudio: true, offerToReceiveVideo: false
      }));

      let answerSdpWsMessage = {
        type: "ANSWER_SDP",
        room_id: msg.room_id,
        to_member_id: msg.from_member_id,
        to_member_name: msg.from_member_name,
        from_member_id: msg.to_member_id,
        from_member_name: msg.to_member_name
      }
      answerSdpWsMessage.answer_sdp = JSON.stringify(peersRef.current[peerId].conn.localDescription)
      wsRef.current.send(JSON.stringify(answerSdpWsMessage))
    } else if (msg.type === "ANSWER_SDP") {
      addPeerToListIfMissing(msg)
      let peerId = msg.from_member_id
      await peersRef.current[peerId].conn.setRemoteDescription(JSON.parse(msg.answer_sdp))
    } else if (msg.type === "JOIN_REQUEST_RECEIVED") {
      myId.current = msg.member_id;
      myName.current = msg.member_name
      console.log('set client id with ', msg.member_id)
    } else if (msg.type === "ICE_CANDIDATES") {
      addPeerToListIfMissing(msg)
      let peerId = msg.from_member_id
      let ice_candidates = JSON.parse(msg.ice_candidate);
      await peersRef.current[peerId].conn.addIceCandidate(ice_candidates[0])
      console.log('added ice candidate from ', peerId, ' in rtcPeerConnection')
    }
  }

  const initNewRTCPeerConn = async (peerId) => {
    peersRef.current[peerId].conn = getRTCPeerConnection(peerId)
    peersRef.current[peerId].conn.onicecandidate = async (e) => {
      console.log('on ice candidate', e)
      if (e.candidate) {
        let iceCandidatesWsMsg = {
          type: "ICE_CANDIDATES",
          room_id: roomRef.current,
          from_member_id: myId.current,
          from_member_name: myName.current,
          to_member_id: peerId,
          to_member_name: peersRef.current[peerId].name,
          ice_candidate: JSON.stringify(e.candidate.toJSON())
        }
        console.log("sending ice candidate to ", peerId)
        wsRef.current.send(JSON.stringify(iceCandidatesWsMsg))
      }
    }

    peersRef.current[peerId].conn.onnegotiationneeded = async (e) => {
      console.log("received negotiation needed event with peer ", peerId);
      const offer = await peersRef.current[peerId].conn.createOffer({offerToReceiveAudio: true, offerToReceiveVideo: false})
      if (peersRef.current[peerId].conn.signalingState !== "stable") {
        console.log("created offer for ", peerId, ' but not sending as state is not stable')
        return;
      }
      console.log('sending offer for ', peerId)
      await sendOfferMsgGivenOffer(peerId, offer)
    }

    peersRef.current[peerId].conn.ontrack = (e) => {
      console.log("received track from ", peerId)
      remoteAudioStreams.peerId = e.streams[0];
      setRemoteAudioStreams({...remoteAudioStreams})
    }
  }

  const getAudioElements = () => {
      return (
        <div>
          {
            Object.keys(remoteAudioStreams).map((key, index) => {
              return ( <audio key={key} ref={audio => { audio.srcObject = remoteAudioStreams[key] }} controls /> );
            })
          }
        </div>
      )
  }

  return (
    <div className="App">
      <input type="text" value={name} onChange={e => setName(e.target.value)}/>
      <button onClick={() => createWsConn()}>WS Conn</button>
      <button onClick={() => joinRoom()}>Join Room</button>
      <input type="text" readOnly={true} value={myId.current}/>
      <button onClick={() => addMedia()}>Send my audio</button>
      {getAudioElements()}
    </div>
  );
}

export default App;
