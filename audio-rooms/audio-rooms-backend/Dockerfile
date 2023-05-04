FROM openjdk:17-alpine
ENV JAVA_OPTS='-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/'

RUN apk upgrade -U \
 && apk add curl \
 && rm -rf /var/cache/*

RUN apk add --no-cache nss
ARG JAR_FILE

COPY ${JAR_FILE} signalling-server.jar


ENTRYPOINT exec java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom  -jar /signalling-server.jar
