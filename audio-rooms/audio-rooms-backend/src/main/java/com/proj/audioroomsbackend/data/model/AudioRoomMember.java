package com.proj.audioroomsbackend.data.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "room_members")
public class AudioRoomMember {
    @Id
    private String memberId;
    private String roomId;
    private String memberName;
}
