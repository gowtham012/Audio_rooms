package com.proj.audioroomsbackend.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proj.audioroomsbackend.data.dto.WebSocketMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Slf4j
public class WebSocketUtil {
    public static ObjectMapper mapper = ObjectMapperFactory.getSnakeCaseObjectMapper();

    public static <T extends WebSocketMessage>  void sendMessage(WebSocketSession session, T message) {
        String messageInStr = null;
        try {
            messageInStr = mapper.writeValueAsString(message);
            session.sendMessage(new TextMessage(messageInStr.getBytes(StandardCharsets.UTF_8)));
        } catch (IOException e) {
            log.error("SessionId: {}, Unable to send message. Message: {}", session.getId(), message.toString());
        }
    }
}
