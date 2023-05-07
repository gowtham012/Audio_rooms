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
public class AudioRoomMemberMsgTransferDto extends WebSocketMessage {
    private String roomId;
    private String fromMemberId;
    private String fromMemberName;
    private String toMemberId;
    private String toMemberName;
    private String offerSdp;
    private String answerSdp;
    private String iceCandidate;

    public AudioRoomMemberMsgTransferDto(String type, String roomId, String fromMemberId, String fromMemberName,
        String toMemberId, String toMemberName) {
        super(type);
        this.roomId = roomId;
        this.fromMemberId = fromMemberId;
        this.fromMemberName = fromMemberName;
        this.toMemberId = toMemberId;
        this.toMemberName = toMemberName;
    }

    public AudioRoomMemberMsgTransferDto(String type, String roomId, String fromMemberId, String fromMemberName,
            String toMemberId, String toMemberName, String offerSdp, String answerSdp, String iceCandidate) {
        this(type, roomId, fromMemberId, fromMemberName, toMemberId, toMemberName);
        this.offerSdp = offerSdp;
        this.answerSdp = answerSdp;
        this.iceCandidate = iceCandidate;
    }
}
