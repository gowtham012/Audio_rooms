package com.proj.audioroomsbackend.repository;

import com.proj.audioroomsbackend.data.model.AudioRoomMember;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AudioRoomMemberRepository extends CrudRepository<AudioRoomMember, String> {
    List<AudioRoomMember> getAudioRoomMembersByRoomId(String roomId);
    Optional<AudioRoomMember> getAudioRoomMemberByMemberId(String memberId);
}
