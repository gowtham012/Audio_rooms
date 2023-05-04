
import {getConstants} from "./Utils";

const constants = getConstants()

export class WsClient {

  constructor(onMessageFn, onCloseFn) {
    this.onMessageFn = onMessageFn;
    this.onCloseFn = onCloseFn;
  };

  start = (roomId, name) => {
    return this.newWsClient(roomId, name)
  };

  newWsClient = (roomId, name) => {
    let _ws = new WebSocket(constants.urls.wsJoinUrl);

    _ws.onopen = () => {
      console.log("conn established with ", constants.urls.wsJoinUrl);
      _ws.send(JSON.stringify({
        type: "JOIN_REQUEST",
        "room_id": roomId,
        "member_name": name
      }));
    }

    _ws.onclose = () => {
      console.log("conn got closed");
      this.onCloseFn()
    }

    _ws.onerror = (e) => {
      console.log("error on socket", e);
    }

    _ws.onmessage = async (e) => {
      await this.onMessageFn(JSON.parse(e.data))
    }
    return _ws;
  }
}

