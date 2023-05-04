package com.proj.audioroomsbackend.util;

import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.locks.ReentrantLock;

@Slf4j
public class CloseableReentrantLock extends ReentrantLock implements AutoCloseable {

    public CloseableReentrantLock open() {
        log.info("acquired activity lock");
        this.lock();
        return this;
    }

    @Override
    public void close() {
        this.unlock();
        log.info("released activity lock");
    }
}
