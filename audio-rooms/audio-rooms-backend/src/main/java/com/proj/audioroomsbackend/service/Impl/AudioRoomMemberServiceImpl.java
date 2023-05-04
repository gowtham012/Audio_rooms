package com.proj.audioroomsbackend.service.Impl;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import com.proj.audioroomsbackend.data.AudioRoomMemberSocketSession;
import com.proj.audioroomsbackend.data.dto.AudioRoomMemberJoinReqDto;
import com.proj.audioroomsbackend.data.dto.AudioRoomMemberJoinResDto;
import com.proj.audioroomsbackend.data.dto.AudioRoomMemberMsgTransferDto;
import com.proj.audioroomsbackend.data.dto.AudioRoomMemberMuteReqDto;
import com.proj.audioroomsbackend.data.dto.IceServerUrl;
import com.proj.audioroomsbackend.data.model.AudioRoom;
import com.proj.audioroomsbackend.data.model.AudioRoomMember;
import com.proj.audioroomsbackend.repository.AudioRoomMemberRepository;
import com.proj.audioroomsbackend.service.AudioRoomMemberService;
import com.proj.audioroomsbackend.service.AudioRoomService;
import com.proj.audioroomsbackend.util.CloseableReentrantLock;
import com.proj.audioroomsbackend.util.WebSocketUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class AudioRoomMemberServiceImpl implements AudioRoomMemberService {
    private final ConcurrentHashMap<String, Map<String, AudioRoomMemberSocketSession>> audioRoomMemberSessions;
    private final ConcurrentHashMap<String, String> sessionAndRoomMemberMapping;
    private final AudioRoomService audioRoomService;
    private final AudioRoomMemberRepository audioRoomMemberRepository;
    private final CloseableReentrantLock activityLock;
    private final List<IceServerUrl> defaultIceServers;

    public AudioRoomMemberServiceImpl(AudioRoomService audioRoomService, AudioRoomMemberRepository roomMemberRepository, List<IceServerUrl> defaultIceServers) {
        audioRoomMemberSessions = new ConcurrentHashMap<>();
        sessionAndRoomMemberMapping = new ConcurrentHashMap<>();
        this.audioRoomService = audioRoomService;
        this.audioRoomMemberRepository = roomMemberRepository;
        this.activityLock = new CloseableReentrantLock();
        this.defaultIceServers = defaultIceServers;
    }

    private AudioRoomMember getAudioRoomMemberById(String memberId) {
        Optional<AudioRoomMember> res = audioRoomMemberRepository.getAudioRoomMemberByMemberId(memberId);
        if (res.isEmpty()) {
            log.error("MemberId: {}, Unable to find the audio room member", memberId);
            throw new RuntimeException(String.format("resource not found with memberId: %s", memberId));
        }
        return res.get();
    }

    public Map<String, AudioRoomMemberSocketSession> getAudioRoomMemberSessions(String roomId) {
        if (!audioRoomMemberSessions.containsKey(roomId)) {
            audioRoomMemberSessions.put(roomId, new HashMap<>());
        }
        return audioRoomMemberSessions.get(roomId);
    }

    /**
     * invokes on JOIN_REQUEST from client
     * ack by send JOIN_REQUEST_ACCEPTED message
     * ask existing peers for offer message
     */
    @Override
    public void addMemberSession(AudioRoomMemberJoinReqDto req, WebSocketSession session) {
        try (CloseableReentrantLock lock = activityLock.open()) {
            AudioRoom audioRoom = audioRoomService.getAudioRoom(req.getRoomId());

            // send ack for request which includes ROOM_NAME; UI will show waiting to join screen after reading ack
            AudioRoomMember audioRoomMember = addAudioRoomMemberEntryInDB(req, audioRoom);
            getAudioRoomMemberSessions(audioRoom.getId()).put(audioRoomMember.getMemberId(), new AudioRoomMemberSocketSession(audioRoomMember, session));
            sessionAndRoomMemberMapping.put(session.getId(), audioRoomMember.getMemberId());
            AudioRoomMemberJoinResDto ack = sendJoinRequestReceivedMessage(audioRoom, audioRoomMember);
            WebSocketUtil.sendMessage(session, ack);

            // send offer sdp of all the existing members; UI will still show waiting screen
            // frontend will respond with answer_sdps
            askPeerForOfferMessage(req.getRoomId(), audioRoomMember);
        }
    }

    private void askPeerForOfferMessage(String roomId, AudioRoomMember newMember) {
       for (AudioRoomMemberSocketSession session : getAudioRoomMemberSessions(roomId).values()) {
           if (!session.getRoomMember().getMemberId().equals(newMember.getMemberId())) {
               AudioRoomMemberMsgTransferDto req = new AudioRoomMemberMsgTransferDto("OFFER_MESSAGE_REQUEST", roomId,
                   newMember.getMemberId(), newMember.getMemberName(),
                   session.getRoomMember().getMemberId(), session.getRoomMember().getMemberName(), null, null, null);
               WebSocketUtil.sendMessage(session.getSession(), req);
           }
       }
    }


    public void sendMuteMessage(AudioRoomMemberMuteReqDto req) {
        String roomId = req.getRoomId();
        AudioRoomMember member = getAudioRoomMemberById(req.getMemberId());
        for (AudioRoomMemberSocketSession session : getAudioRoomMemberSessions(roomId).values()) {
            if (!session.getRoomMember().getMemberId().equals(req.getMemberId())) {
                AudioRoomMemberMsgTransferDto msg = new AudioRoomMemberMsgTransferDto(req.getType(), roomId,
                    member.getMemberId(), member.getMemberName(),
                    session.getRoomMember().getMemberId(), session.getRoomMember().getMemberName(), null, null, null);
                WebSocketUtil.sendMessage(session.getSession(), msg);
            }
        }
    }

    private void sendLeftMessage(String roomId, AudioRoomMember member) {
        for (AudioRoomMemberSocketSession session : getAudioRoomMemberSessions(roomId).values()) {
            if (!session.getRoomMember().getMemberId().equals(member.getMemberId())) {
                AudioRoomMemberMsgTransferDto req = new AudioRoomMemberMsgTransferDto("MEMBER_LEFT", roomId,
                    member.getMemberId(), member.getMemberName(),
                    session.getRoomMember().getMemberId(), session.getRoomMember().getMemberName(), null, null, null);
                WebSocketUtil.sendMessage(session.getSession(), req);
            }
        }
    }

    private AudioRoomMember addAudioRoomMemberEntryInDB(AudioRoomMemberJoinReqDto req, AudioRoom audioRoom) {
        AudioRoomMember audioRoomMember = new AudioRoomMember(
            NanoIdUtils.randomNanoId(),
            audioRoom.getId(),
            req.getMemberName()
        );
        return audioRoomMemberRepository.save(audioRoomMember);
    }

    AudioRoomMemberJoinResDto sendJoinRequestReceivedMessage(AudioRoom audioRoom, AudioRoomMember audioRoomMember) {

        return new AudioRoomMemberJoinResDto(
            "JOIN_REQUEST_RECEIVED",
            audioRoom.getId(), audioRoom.getName(),
            audioRoomMember.getMemberId(), audioRoomMember.getMemberName(),
            defaultIceServers);
    }

    @Override
    public void removeSession(String sessionId) {
        try (CloseableReentrantLock lock = activityLock.open()) {
            String memberId = sessionAndRoomMemberMapping.get(sessionId);
            sessionAndRoomMemberMapping.remove(sessionId);
            Optional<AudioRoomMember> optionalAudioRoomMember = audioRoomMemberRepository.getAudioRoomMemberByMemberId(memberId);
            if (optionalAudioRoomMember.isEmpty())
                return;

            AudioRoomMember audioRoomMember = optionalAudioRoomMember.get();
            log.info("Session: {}, RoomId: {}, MemberId: {}, removing session", sessionId, audioRoomMember.getRoomId(), memberId);

            sendLeftMessage(audioRoomMember.getRoomId(), audioRoomMember);
            audioRoomMemberSessions.get(audioRoomMember.getRoomId()).remove(memberId);
            if (audioRoomMemberSessions.get(audioRoomMember.getRoomId()).isEmpty())
                audioRoomMemberSessions.remove(audioRoomMember.getRoomId());
            audioRoomMemberRepository.delete(audioRoomMember);
        }
    }

    @Override
    public void forwardSdpMessages(AudioRoomMemberMsgTransferDto audioRoomMembersSdpDto, WebSocketSession session) {
        try (CloseableReentrantLock lock = activityLock.open()) {
            String roomId = audioRoomMembersSdpDto.getRoomId();
            String toMemberId = audioRoomMembersSdpDto.getToMemberId();
            WebSocketSession dest = getAudioRoomMemberSessions(roomId).get(toMemberId).getSession();
            WebSocketUtil.sendMessage(dest, audioRoomMembersSdpDto);
        }
    }
}
