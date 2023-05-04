package com.proj.audioroomsbackend.controller;

import com.proj.audioroomsbackend.data.model.AudioRoom;
import com.proj.audioroomsbackend.service.AudioRoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Slf4j
@RequestMapping("/apis/v1/rooms")
@CrossOrigin
@RequiredArgsConstructor(onConstructor = @__(@Autowired))
public class AudioRoomController {
    private final AudioRoomService audioRoomService;

    @PostMapping
    AudioRoom createAudioRoom(@RequestBody AudioRoom audioRoom) {
        return audioRoomService.createAudioRoom(audioRoom.getName());
    }

    @GetMapping("/{id}")
    AudioRoom getAudioRoom(@PathVariable String id) {
        return audioRoomService.getAudioRoom(id);
    }
}
