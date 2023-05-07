package com.proj.audioroomsbackend.socket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proj.audioroomsbackend.data.dto.AudioRoomMemberJoinReqDto;
import com.proj.audioroomsbackend.data.dto.AudioRoomMemberMsgTransferDto;
import com.proj.audioroomsbackend.data.dto.AudioRoomMemberMuteReqDto;
import com.proj.audioroomsbackend.data.dto.WebSocketMessage;
import com.proj.audioroomsbackend.service.AudioRoomMemberService;
import com.proj.audioroomsbackend.util.ObjectMapperFactory;
import com.proj.audioroomsbackend.util.WebSocketUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.AbstractWebSocketHandler;

@Slf4j
@Component
@RequiredArgsConstructor(onConstructor = @__(@Autowired))
public class RoomSocketHandler extends AbstractWebSocketHandler {
    private static final ObjectMapper mapper = ObjectMapperFactory.getSnakeCaseObjectMapper();
    private final AudioRoomMemberService roomMemberService;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("SessionId: {}, websocket connection established", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws JsonProcessingException {
        log.info("SessionId: {}, message received: {}", session.getId(), message.getPayload());
        WebSocketMessage baseMessage = mapper.readValue(message.getPayload(), WebSocketMessage.class);
        switch (baseMessage.getType()) {
            case "PING" -> {
                WebSocketUtil.sendMessage(session, new WebSocketMessage("PONG"));
            }
            case "JOIN_REQUEST" -> {
                AudioRoomMemberJoinReqDto req = mapper.readValue(message.getPayload(),
                    AudioRoomMemberJoinReqDto.class);
                roomMemberService.addMemberSession(req, session);
            }
            case "OFFER_SDP", "ANSWER_SDP", "ICE_CANDIDATES" -> {
                AudioRoomMemberMsgTransferDto answerSdpDto = mapper.readValue(message.getPayload(),
                    AudioRoomMemberMsgTransferDto.class);
                roomMemberService.forwardSdpMessages(answerSdpDto, session);
            }
            case "MUTED", "UNMUTED" -> {
                AudioRoomMemberMuteReqDto muteReqDto = mapper.readValue(message.getPayload(),
                    AudioRoomMemberMuteReqDto.class);
                roomMemberService.sendMuteMessage(muteReqDto);
            }
            default -> log.warn("SessionId: {}, message with unknown type encountered. Message: {}",
                session.getId(), message.getPayload());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        roomMemberService.removeSession(session.getId());
        log.info("SessionId: {}, connection closed with reason: {}", session.getId(), status.getReason());
    }
}
