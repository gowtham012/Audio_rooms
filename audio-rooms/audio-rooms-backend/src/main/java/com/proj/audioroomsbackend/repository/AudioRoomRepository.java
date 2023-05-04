package com.proj.audioroomsbackend.repository;

import com.proj.audioroomsbackend.data.model.AudioRoom;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AudioRoomRepository extends CrudRepository<AudioRoom, String> {
    Optional<AudioRoom> getAudioRoomById(String id);
}
