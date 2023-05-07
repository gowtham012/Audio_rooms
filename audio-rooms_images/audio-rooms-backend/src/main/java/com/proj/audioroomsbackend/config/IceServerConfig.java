package com.proj.audioroomsbackend.config;

import com.proj.audioroomsbackend.data.dto.IceServerUrl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class IceServerConfig {

    @Bean
    List<IceServerUrl> defaultIceServers() {
        String uname = "gHmAcR-KnnqyO9UtNQy-32UG3fex3R7FYqy5mkoYLJ3qhudsGrULi4yWE62CxH-OAAAAAGRI_bhwcmVldGhhbQ==";
        String pwd = "a24d6ff0-e41d-11ed-8ad4-0242ac140004";

        List<IceServerUrl> urls = new ArrayList<>();
        urls.add(new IceServerUrl("stun:bn-turn1.xirsys.com", uname, pwd));
        urls.add(new IceServerUrl("turn:bn-turn1.xirsys.com:80?transport=udp", uname, pwd));
        urls.add(new IceServerUrl("turn:bn-turn1.xirsys.com:3478?transport=udp", uname, pwd));
        urls.add(new IceServerUrl("turn:bn-turn1.xirsys.com:80?transport=tcp", uname, pwd));
        urls.add(new IceServerUrl("turn:bn-turn1.xirsys.com:3478?transport=tcp", uname, pwd));
        urls.add(new IceServerUrl("turns:bn-turn1.xirsys.com:443?transport=tcp", uname, pwd));
        urls.add(new IceServerUrl("turns:bn-turn1.xirsys.com:5349?transport=tcp", uname, pwd));
        return urls;
    }
}
