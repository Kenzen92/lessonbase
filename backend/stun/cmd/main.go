package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	stun "kennysolutions/stun"
)

func main() {
	port := os.Getenv("STUN_PORT")
	if port == "" {
		port = "3478"
	}

	secret := os.Getenv("STUN_SECRET")

	var auth *stun.Authenticator
	if secret != "" {
		auth = stun.NewAuthenticator(secret)
		log.Println("STUN authentication enabled (short-term credentials)")
	} else {
		log.Println("STUN authentication disabled (no STUN_SECRET set)")
	}

	server := &stun.Server{
		Addr: ":" + port,
		Auth: auth,
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle graceful shutdown.
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		sig := <-sigCh
		log.Printf("Received signal %v, shutting down...", sig)
		cancel()
	}()

	if err := server.ListenAndServe(ctx); err != nil {
		log.Fatalf("STUN server error: %v", err)
	}
}
