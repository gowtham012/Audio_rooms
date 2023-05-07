package com.proj.audioroomsbackend.service.Impl;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.proj.audioroomsbackend.data.model.AudioRoom;
import com.proj.audioroomsbackend.repository.AudioRoomRepository;
import com.proj.audioroomsbackend.service.AudioRoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor(onConstructor = @__(@Autowired))
public class AudioRoomServiceImpl implements AudioRoomService {
    private final AudioRoomRepository audioRoomRepository;

    @Override
    public AudioRoom createAudioRoom(String name) {
        AudioRoom audioRoom = new AudioRoom(NanoIdUtils.randomNanoId(), name);
        audioRoom = audioRoomRepository.save(audioRoom);
        return audioRoom;
    }

    @Override
    public AudioRoom getAudioRoom(String id) {
        Optional<AudioRoom> room = audioRoomRepository.getAudioRoomById(id);
        if (room.isEmpty()) {
            log.error("Unable to find room with id: {}", id);
            throw new RuntimeException("room not found");
        }
        return room.get();
    }
}
