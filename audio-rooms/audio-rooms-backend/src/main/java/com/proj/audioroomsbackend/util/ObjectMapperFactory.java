package com.proj.audioroomsbackend.util;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.io.IOException;

public class ObjectMapperFactory {

    private static final ObjectMapper snakeCaseObjectMapper;
    private static final ObjectMapper pascalCaseObjectMapper;

    static {
        snakeCaseObjectMapper = new ObjectMapper();
        snakeCaseObjectMapper.configure(DeserializationFeature.UNWRAP_ROOT_VALUE, false);
        snakeCaseObjectMapper.configure(SerializationFeature.WRAP_ROOT_VALUE, false);
        snakeCaseObjectMapper.configure(DeserializationFeature.ACCEPT_SINGLE_VALUE_AS_ARRAY, true);
        snakeCaseObjectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        snakeCaseObjectMapper.setPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE);
        setVisibilityToFieldsOnly(snakeCaseObjectMapper);

        pascalCaseObjectMapper = new ObjectMapper();
        pascalCaseObjectMapper.configure(DeserializationFeature.UNWRAP_ROOT_VALUE, false);
        pascalCaseObjectMapper.configure(SerializationFeature.WRAP_ROOT_VALUE, false);
        pascalCaseObjectMapper.configure(DeserializationFeature.ACCEPT_SINGLE_VALUE_AS_ARRAY, true);
        pascalCaseObjectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        pascalCaseObjectMapper.setPropertyNamingStrategy(PropertyNamingStrategy.LOWER_CAMEL_CASE);
        setVisibilityToFieldsOnly(pascalCaseObjectMapper);
    }

    private static void setVisibilityToFieldsOnly(ObjectMapper mapper) {
        mapper.setVisibility(mapper.getSerializationConfig().getDefaultVisibilityChecker()
                .withFieldVisibility(JsonAutoDetect.Visibility.ANY)
                .withGetterVisibility(JsonAutoDetect.Visibility.NONE)
                .withSetterVisibility(JsonAutoDetect.Visibility.NONE)
                .withCreatorVisibility(JsonAutoDetect.Visibility.NONE));
    }

    public static ObjectMapper getSnakeCaseObjectMapper() {
        return snakeCaseObjectMapper;
    }

    public static ObjectMapper getPascalCaseObjectMapper() {
        return pascalCaseObjectMapper;
    }

    public static <T> T snakeCaseJsonToObject(String json, Class<T> responseType) {
        try {
            if (json == null || json.isEmpty()) {
                return null;
            }
            return getSnakeCaseObjectMapper().readValue(json.getBytes(), responseType);
        } catch (IOException e) {
            throw new IllegalStateException("Json parsing error", e);
        }
    }

    public static <T> T pascalCaseJsonToObject(String json, Class<T> responseType) {
        try {
            if (json == null || json.isEmpty()) {
                return null;
            }
            return getPascalCaseObjectMapper().readValue(json.getBytes(), responseType);
        } catch (IOException e) {
            throw new IllegalStateException("Json parsing error", e);
        }
    }
}
