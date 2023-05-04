import './AudioRoom.css'
import {useEffect, useRef, useState} from "react";
import {AudioMutedOutlined, AudioOutlined, SendOutlined, UserOutlined} from "@ant-design/icons";
import {Badge, Button, notification} from "antd";
import Avatar from "antd/es/avatar/avatar";
import {WsClient} from "../js/Websocket";
import {RTCConnection} from "../js/RTCConnections";
import {getConstants} from "../js/Utils";
import axios from "axios";
import {useLocation, useNavigate} from 'react-router-dom';


const constants = getConstants();

/**
 * inputs: Participant name, room id
 */
export const AudioRoom = () => {
  const navigate = useNavigate();
  const location = useLocation()
  const data = location.state
  let myName = "";
  let roomId = "";
  if (data != null) {
    myName = data.myName;
    roomId = data.roomId
  }
  const myId = useRef("")

  const streamRef = useRef(null);
  const [streamRefInit, setStreamRefInit] = useState(false);
  const [roomName, setRoomName] = useState("Loading...");
  const [micMuted, setMicMuted] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const peersRef = useRef({});
  const [peerStreamsStatus, setPeerStreamsStatus] = useState({});
  const peerStreamRef = useRef({});
  const [iceServers, setIceServers] = useState({});
  const [pingStatus, setPingStatus] = useState(false);

  const removePeer = async (peerId) => {
    console.log("removing peer", peerId);
    delete peersRef.current[peerId]
    delete peerStreamsStatus[peerId]
    delete peerStreamRef.current[peerId]
    setPeerStreamsStatus({...peerStreamsStatus})
  }

  const onPeerAudioTrack = (peerId, s) => {
    console.log("peer audio track with id: ", s.id, " from ", peerId);
    peerStreamRef.current[peerId] = s;
    const track = s.getAudioTracks()[0];
    track.onended = async (e) => {
      console.log("track from peer ", peerId, "ended");
      await removePeer(peerId);
    }

    peerStreamsStatus[peerId] = {
      muted: !s.getAudioTracks()[0].enabled
    };

    setPeerStreamsStatus({...peerStreamsStatus});
  }

  const wsSender = (msg) => {
    console.log("sending to ws server", msg)
    wsClientRef.current.send(msg)
  };

  const onPeerConnectionChange = async (peerId, state) => {
    if (state === "disconnected") {
      console.log("peer disconnected ", peerId);
      await removePeer(peerId);
    } else if (state === "connected") {
      console.log("peer connected ", peerId);
    }
  }

  let rtcConnection = useRef(new RTCConnection(myName, roomId, peersRef, wsSender, onPeerAudioTrack, onPeerConnectionChange));
  let [joinAckReceived, setJoinAckReceived] = useState(false);

  const leaveRoom = () => {
    wsClientRef.current.close();
    streamRef.current.getTracks().forEach(function(track) {
      track.stop();
    });

    api.info({
      label: "leaving room",
      position: "bottom",
      duration: 2
    })
    navigate('/', {state: {tab: "1"}});
  }

  const onWsClose = () => {
    console.log("websocket session closed with server");
    leaveRoom()
  };

  const sendPing = async () => {
    if (wsClientRef.current == null)
      return;
    await wsClientRef.current.send(JSON.stringify({
      type: "PING"
    }))
    setPingStatus(true);
  };

  useEffect(() => {
    const interval = setInterval(() => sendPing(), 5000)
    return () => {
      // reset timer
      clearInterval(interval);
    }
  }, [pingStatus])

  const onWsMessage = async (msg) => {
    console.log("handling msg", msg)
    const type = msg.type;

    if (type === "PONG") {
      return;
    }

    if (type === "JOIN_REQUEST_RECEIVED") {
      console.log("handling JOIN_REQUEST_RECEIVED");
      myId.current = msg.member_id;
      setIceServers(msg.ice_servers);
      setJoinAckReceived(true);
    }

    const peerId = msg.from_member_id;
    const peerName = msg.from_member_name;

    if (type === "OFFER_MESSAGE_REQUEST") {
      console.log("handling OFFER_MESSAGE_REQUEST from ", peerId)
      await rtcConnection.current.addPeerToList(peerId, peerName, false);
    }

    if (type === "OFFER_SDP") {
      await rtcConnection.current.onOfferSdpFromPeer(peerId, peerName, JSON.parse(msg.offer_sdp))
    }

    if (type === "ANSWER_SDP") {
      await rtcConnection.current.onAnswerSdpFromPeer(peerId, peerName, JSON.parse(msg.answer_sdp))
    }

    if (type === "ICE_CANDIDATES") {
      await rtcConnection.current.onIceCandidateFromPeer(peerId, peerName, JSON.parse(msg.ice_candidate));
    }

    if (type === "MEMBER_LEFT") {
      await removePeer(peerId);
    }
  };

  const wsClientCaller = useRef(new WsClient(onWsMessage, onWsClose));
  const wsClientRef = useRef(null);

  useEffect( () => {
    console.log("init use effect");

    if (data == null || roomId === "") {
      navigate('/', {state: {tab: "1", errorMsg: "Invalid Room ID"}});
    }

    // Hit /rooms/{id} api to get room name
    axios.get(constants.urls.getRoomUrl + roomId).then((res) => {
      setRoomName(res.data.name);
    }).catch((e) => {
       navigate("/", {state: {tab: "1", errorMsg: "Invalid Room ID"}});
    })

    navigator.mediaDevices.getUserMedia({
      audio: true, video: false
    }).then((s) => {
      console.log("initialized streamRef");
      streamRef.current = s;
      setStreamRefInit(true);
    });

    // axios.get("https://wtf.metered.live/api/v1/turn/credentials?apiKey=3b4ec7ab21b3213e98887f20503368d772a9").then((res) => {
    //   setIceServers(res.data);
    // });

  }, []);


  useEffect(() => {
    if (roomName !== "Loading...") {
      // open websocket conn and send JOIN_REQUEST msg immediately
      wsClientRef.current = wsClientCaller.current.start(roomId, myName);
    }
  }, [roomName]);

  useEffect( () => {
    if ((joinAckReceived === true) && (iceServers !== {}) && (streamRefInit === true)) {
      console.log("streamRef: ", streamRef)
      rtcConnection.current.init(myId, iceServers, streamRef);
    }
  }, [joinAckReceived, iceServers, streamRefInit])


  const alterMic = async () => {
    console.log("altering mic. existing mute status: ", micMuted, ', converting to ', !micMuted);
    let newMicMuted = !micMuted;
    let type = newMicMuted ? "MUTED" : "UNMUTED"
    await wsClientRef.current.send(JSON.stringify({
      type: type,
      "room_id": roomId,
      "member_id": myId.current
    }));
    setMicMuted(newMicMuted);
    streamRef.current.getAudioTracks()[0].enabled = !(streamRef.current.getAudioTracks()[0].enabled);
  }

  const getAudioIcon = () => {
    if (micMuted === true) {
      return (
        <Button danger className="mic-btn-muted" onClick={() => alterMic()} icon={<AudioMutedOutlined className="audio-muted-icon"/>}/>
      );
    } else {
      return (
        <Button type="primary" className="mic-btn-unmuted" onClick={() => alterMic()} icon={<AudioOutlined/>}/>
      );
    }
  }

  const getMemberBadge = (mutedFlag) => {
    if (mutedFlag === true) {
      return (
        // <Badge count={<AudioMutedOutlined className="audio-muted-icon"/>}>
          <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
        // </Badge>
      )
    } else {
      return (
        // <Badge count={<AudioOutlined className="audio-unmuted-icon"/>}>
          <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />}/>
        // </Badge>
      );
    }
  }

  const getAudioTag = (peerId) => {
    console.log(peerStreamRef.current[peerId]);
    if (peerStreamRef.current.hasOwnProperty(peerId) && peerStreamRef.current[peerId] !== null)
      return ( <audio ref={audio => {
        if (audio != null) {
          audio.srcObject = peerStreamRef.current[peerId]
        }
      }} hidden={true} autoPlay />
      );
    return {};
  }

  const copyJoinUrlToClipboard = () => {
    const shareUrl = constants.host + "/join/" + roomId;
    console.log("adding " + shareUrl + " to clipboard")
    navigator.clipboard.writeText(shareUrl);
    api.success({
      message: "Copied invite link to clipboard",
      placement: "bottom",
      duration: 3
    })
  }

  const getShareRoomIcon = () => {
    return (
      <Button type="primary"
              className="share-room-btn"
              icon={<SendOutlined />}
              onClick={() => copyJoinUrlToClipboard()}
      >
        Invite others
      </Button>
    )
  }

  const getLeaveRoomIcon = () => {
    return (
      <Button className="leave-room-btn" danger default onClick={() => leaveRoom()}>Leave</Button>
    )
  }

  const getMembersContent = () => {
    return (
      <div className="audio-room-members-div-wrap">
        <p>participants in the call</p>
        <div className="audio-room-members-div">
          {
            Object.keys(peerStreamsStatus)
            .filter((key) => peerStreamsStatus[key] !== null)
            .map((key) => {
            return (
              <div className="audio-room-members-div-item" key={peersRef.current[key].id}>
                {getMemberBadge(peerStreamsStatus[key].muted)}
                <p>{peersRef.current[key].name}</p>
                {getAudioTag(key)}
              </div>
            );
          })}
        </div>
      </div>
    )
  }

  const getAudioRoomContent = () => {
    return (
      <div className="audio-room-content">
        {contextHolder}
        <div className="audio-room-name-div">
          <p>{roomName}</p>
        </div>
        {getMembersContent()}
        <div className="audio-room-controls-div">
          {getAudioIcon()}
          {getShareRoomIcon()}
          {getLeaveRoomIcon()}
        </div>
      </div>
    )
  }

  return (
    <div className="AudioRoom">
      <div className="Header">
        <p>audio rooms</p>
      </div>
      <hr/>
      {getAudioRoomContent()}
    </div>
  )
}