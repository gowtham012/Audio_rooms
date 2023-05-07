
export const getConstants = () => {
  let constants = {
    serverHost: process.env.SERVER_HOST || 'audio-rooms.whatthefuck.in',
    host: process.env.HOST || 'https://audio-rooms.whatthefuck.in',
    peerAudioStatusRefreshInterval: 2000,
  };

  constants['urls'] = {
    createRoomUrl: "https://" + constants["serverHost"] + "/apis/v1/rooms",
    getRoomUrl: "https://" + constants["serverHost"] + "/apis/v1/rooms/",
    wsJoinUrl: "wss://" + constants["serverHost"] + "/apis/join",
  }
  return constants;
}

