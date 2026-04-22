# docker/python.Dockerfile
# Minimal Python sandbox — no internet, no extra packages
FROM python:3.11-alpine
RUN adduser -D -u 1001 sandbox
USER sandbox
WORKDIR /sandbox
