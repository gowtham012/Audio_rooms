package com.proj.audioroomsbackend.service;

import com.proj.audioroomsbackend.data.model.AudioRoom;

public interface AudioRoomService {
    AudioRoom createAudioRoom(String name);
    AudioRoom getAudioRoom(String id);
}
