FROM golang:1.24-alpine AS builder

WORKDIR /app
COPY go.mod ./
COPY *.go ./
COPY cmd/ ./cmd/

RUN CGO_ENABLED=0 GOOS=linux go build -o stun-server ./cmd

FROM alpine:3.19

RUN apk --no-cache add ca-certificates
COPY --from=builder /app/stun-server /usr/local/bin/stun-server

EXPOSE 3478/udp

ENTRYPOINT ["/usr/local/bin/stun-server"]
