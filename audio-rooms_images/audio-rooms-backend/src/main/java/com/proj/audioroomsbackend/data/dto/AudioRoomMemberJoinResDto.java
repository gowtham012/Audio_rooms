package com.proj.audioroomsbackend.data.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategy.SnakeCaseStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Getter
@JsonNaming(SnakeCaseStrategy.class)
public class AudioRoomMemberJoinResDto extends WebSocketMessage {
    private final String roomId;
    private final String roomName;
    private final String memberId;
    private final String memberName;
    private final List<IceServerUrl> iceServers;

    public AudioRoomMemberJoinResDto(String type, String roomId, String roomName, String memberId, String memberName, List<IceServerUrl> iceServers) {
        super(type);
        this.roomId = roomId;
        this.roomName = roomName;
        this.memberId = memberId;
        this.memberName = memberName;
        this.iceServers = iceServers;
    }

}
