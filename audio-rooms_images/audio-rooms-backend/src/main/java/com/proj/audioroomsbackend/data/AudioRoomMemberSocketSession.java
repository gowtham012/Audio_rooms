package com.proj.audioroomsbackend.data;

import com.proj.audioroomsbackend.data.model.AudioRoomMember;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.socket.WebSocketSession;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AudioRoomMemberSocketSession {
    private AudioRoomMember roomMember;
    private WebSocketSession session;
}
