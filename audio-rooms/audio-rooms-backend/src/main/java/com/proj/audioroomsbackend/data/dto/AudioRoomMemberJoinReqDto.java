package com.proj.audioroomsbackend.data.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategy.SnakeCaseStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@JsonNaming(SnakeCaseStrategy.class)
public class AudioRoomMemberJoinReqDto extends WebSocketMessage {
    private String roomId;
    private String memberName;
}
