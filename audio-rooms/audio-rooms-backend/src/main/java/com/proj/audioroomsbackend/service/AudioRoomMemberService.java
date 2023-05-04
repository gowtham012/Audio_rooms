package com.proj.audioroomsbackend.service;

import com.proj.audioroomsbackend.data.dto.AudioRoomMemberJoinReqDto;
import com.proj.audioroomsbackend.data.dto.AudioRoomMemberMsgTransferDto;
import com.proj.audioroomsbackend.data.dto.AudioRoomMemberMuteReqDto;
import org.springframework.web.socket.WebSocketSession;

public interface AudioRoomMemberService {
    void addMemberSession(AudioRoomMemberJoinReqDto req, WebSocketSession session);
    void removeSession(String sessionId);
    void forwardSdpMessages(AudioRoomMemberMsgTransferDto audioRoomMembersSdpDto, WebSocketSession session);
    void sendMuteMessage(AudioRoomMemberMuteReqDto audioRoomMemberMuteReqDto);
}
