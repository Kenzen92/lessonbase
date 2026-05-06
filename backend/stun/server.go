package stun

import (
	"context"
	"log"
	"net"
	"sync"
)

const (
	MaxMessageSize = 1500
	SoftwareName   = "kennysolutions-stun/1.0"
)

// Server is a STUN server that listens on a UDP address.
type Server struct {
	Addr          string
	Auth          *Authenticator
	conn          *net.UDPConn
	mu            sync.Mutex
	shuttingDown  bool
}

// ListenAndServe starts the STUN server and blocks until the context is cancelled.
func (s *Server) ListenAndServe(ctx context.Context) error {
	addr, err := net.ResolveUDPAddr("udp", s.Addr)
	if err != nil {
		return err
	}

	conn, err := net.ListenUDP("udp", addr)
	if err != nil {
		return err
	}
	s.conn = conn

	log.Printf("STUN server listening on %s", conn.LocalAddr())

	// Shutdown goroutine.
	go func() {
		<-ctx.Done()
		s.mu.Lock()
		s.shuttingDown = true
		s.mu.Unlock()
		conn.Close()
	}()

	buf := make([]byte, MaxMessageSize)
	for {
		n, remoteAddr, err := conn.ReadFromUDP(buf)
		if err != nil {
			s.mu.Lock()
			closing := s.shuttingDown
			s.mu.Unlock()
			if closing {
				log.Println("STUN server shutting down")
				return nil
			}
			log.Printf("Read error: %v", err)
			continue
		}

		// Copy the packet data to avoid buffer reuse issues.
		data := make([]byte, n)
		copy(data, buf[:n])

		go s.handlePacket(data, remoteAddr)
	}
}

func (s *Server) handlePacket(data []byte, addr *net.UDPAddr) {
	msg, err := ParseMessage(data)
	if err != nil {
		log.Printf("Failed to parse STUN message from %s: %v", addr, err)
		return
	}

	log.Printf("Received %s from %s", MessageTypeName(msg.Type), addr)

	switch msg.Type {
	case MsgTypeBindingRequest:
		s.handleBindingRequest(msg, addr)
	default:
		log.Printf("Ignoring unsupported message type 0x%04x from %s", msg.Type, addr)
	}
}

func (s *Server) handleBindingRequest(msg *Message, addr *net.UDPAddr) {
	// Authenticate if configured.
	if s.Auth != nil {
		valid, errCode, errReason := s.Auth.Validate(msg)
		if !valid {
			s.sendError(msg.TransactionID, errCode, errReason, addr)
			return
		}
	}

	// Verify FINGERPRINT if present.
	if msg.GetAttribute(AttrFingerprint) != nil {
		if !VerifyFingerprint(msg.Raw) {
			s.sendError(msg.TransactionID, ErrBadRequest, "Invalid FINGERPRINT", addr)
			return
		}
	}

	// Build the Binding Success Response.
	attrs := []Attribute{
		BuildXORMappedAddress(addr, msg.TransactionID),
		BuildSoftware(SoftwareName),
	}

	resp := BuildMessage(MsgTypeBindingResponse, msg.TransactionID, attrs)

	// Add MESSAGE-INTEGRITY if auth is configured and the request had credentials.
	if s.Auth != nil {
		username := msg.GetUsername()
		if username != "" {
			password, ok := s.Auth.CredentialLookup(username)
			if ok {
				resp = ComputeMessageIntegrity(resp, []byte(password))
			}
		}
	}

	// Add FINGERPRINT.
	resp = BuildFingerprint(resp)

	_, err := s.conn.WriteToUDP(resp, addr)
	if err != nil {
		log.Printf("Failed to send response to %s: %v", addr, err)
	} else {
		log.Printf("Sent Binding Success Response to %s (XOR-MAPPED-ADDRESS: %s:%d)", addr, addr.IP, addr.Port)
	}
}

func (s *Server) sendError(txID [12]byte, code int, reason string, addr *net.UDPAddr) {
	attrs := []Attribute{
		BuildErrorCode(code, reason),
		BuildSoftware(SoftwareName),
	}

	resp := BuildMessage(MsgTypeBindingErrorResponse, txID, attrs)
	resp = BuildFingerprint(resp)

	_, err := s.conn.WriteToUDP(resp, addr)
	if err != nil {
		log.Printf("Failed to send error response to %s: %v", addr, err)
	} else {
		log.Printf("Sent Binding Error Response (%d %s) to %s", code, reason, addr)
	}
}
