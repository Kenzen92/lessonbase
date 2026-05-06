package stun

import (
	"encoding/binary"
	"net"
	"testing"
)

func TestParseMessage_ValidBindingRequest(t *testing.T) {
	// Build a minimal Binding Request.
	txID := [12]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12}
	msg := BuildMessage(MsgTypeBindingRequest, txID, nil)

	parsed, err := ParseMessage(msg)
	if err != nil {
		t.Fatalf("ParseMessage failed: %v", err)
	}
	if parsed.Type != MsgTypeBindingRequest {
		t.Errorf("expected type 0x%04x, got 0x%04x", MsgTypeBindingRequest, parsed.Type)
	}
	if parsed.TransactionID != txID {
		t.Errorf("transaction ID mismatch")
	}
}

func TestParseMessage_TooShort(t *testing.T) {
	_, err := ParseMessage([]byte{0, 1, 0, 0})
	if err == nil {
		t.Error("expected error for short message")
	}
}

func TestParseMessage_InvalidMagicCookie(t *testing.T) {
	data := make([]byte, 20)
	binary.BigEndian.PutUint16(data[0:2], MsgTypeBindingRequest)
	binary.BigEndian.PutUint16(data[2:4], 0)
	binary.BigEndian.PutUint32(data[4:8], 0xDEADBEEF) // wrong cookie
	_, err := ParseMessage(data)
	if err == nil {
		t.Error("expected error for invalid magic cookie")
	}
}

func TestBuildAndParseXORMappedAddress_IPv4(t *testing.T) {
	txID := [12]byte{0xA, 0xB, 0xC, 0xD, 0xE, 0xF, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6}
	addr := &net.UDPAddr{
		IP:   net.IPv4(192, 168, 1, 100),
		Port: 12345,
	}

	attr := BuildXORMappedAddress(addr, txID)
	if attr.Type != AttrXORMappedAddress {
		t.Errorf("wrong attribute type")
	}
	if attr.Length != 8 {
		t.Errorf("expected length 8 for IPv4, got %d", attr.Length)
	}

	// Decode XOR-MAPPED-ADDRESS to verify correctness.
	family := attr.Value[1]
	if family != AddrFamilyIPv4 {
		t.Errorf("expected IPv4 family, got %d", family)
	}

	xPort := binary.BigEndian.Uint16(attr.Value[2:4])
	port := xPort ^ uint16(MagicCookie>>16)
	if int(port) != 12345 {
		t.Errorf("expected port 12345, got %d", port)
	}

	mcBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(mcBytes, MagicCookie)
	ip := make([]byte, 4)
	for i := 0; i < 4; i++ {
		ip[i] = attr.Value[4+i] ^ mcBytes[i]
	}
	decoded := net.IP(ip)
	if !decoded.Equal(net.IPv4(192, 168, 1, 100)) {
		t.Errorf("expected 192.168.1.100, got %s", decoded)
	}
}

func TestBuildAndParseXORMappedAddress_IPv6(t *testing.T) {
	txID := [12]byte{0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C}
	addr := &net.UDPAddr{
		IP:   net.ParseIP("2001:db8::1"),
		Port: 8080,
	}

	attr := BuildXORMappedAddress(addr, txID)
	if attr.Length != 20 {
		t.Errorf("expected length 20 for IPv6, got %d", attr.Length)
	}
	if attr.Value[1] != AddrFamilyIPv6 {
		t.Errorf("expected IPv6 family")
	}
}

func TestFingerprint(t *testing.T) {
	txID := NewTransactionID()
	msg := BuildMessage(MsgTypeBindingResponse, txID, []Attribute{
		BuildSoftware("test"),
	})
	msg = BuildFingerprint(msg)

	if !VerifyFingerprint(msg) {
		t.Error("fingerprint verification failed")
	}

	// Corrupt a byte and verify it fails.
	msg[HeaderSize+2] ^= 0xFF
	if VerifyFingerprint(msg) {
		t.Error("fingerprint should fail on corrupted message")
	}
}

func TestMessageIntegrity(t *testing.T) {
	txID := NewTransactionID()
	key := []byte("testpassword")

	// Build a message with USERNAME.
	usernameVal := []byte("testuser")
	attrs := []Attribute{
		{Type: AttrUsername, Length: uint16(len(usernameVal)), Value: usernameVal},
	}
	msg := BuildMessage(MsgTypeBindingRequest, txID, attrs)

	// Add MESSAGE-INTEGRITY.
	msg = ComputeMessageIntegrity(msg, key)

	// Verify it.
	if !VerifyMessageIntegrity(msg, key) {
		t.Error("message integrity verification failed")
	}

	// Wrong key should fail.
	if VerifyMessageIntegrity(msg, []byte("wrongpassword")) {
		t.Error("message integrity should fail with wrong key")
	}
}

func TestBuildErrorCode(t *testing.T) {
	attr := BuildErrorCode(401, "Unauthorized")
	if attr.Type != AttrErrorCode {
		t.Errorf("wrong attribute type")
	}
	// Class should be 4, number should be 1.
	if attr.Value[2] != 4 {
		t.Errorf("expected class 4, got %d", attr.Value[2])
	}
	if attr.Value[3] != 1 {
		t.Errorf("expected number 1, got %d", attr.Value[3])
	}
	reason := string(attr.Value[4:])
	if reason != "Unauthorized" {
		t.Errorf("expected 'Unauthorized', got '%s'", reason)
	}
}

func TestAuthenticator_NoAuth(t *testing.T) {
	// nil authenticator should always pass.
	var auth *Authenticator
	msg := &Message{Type: MsgTypeBindingRequest}
	valid, _, _ := auth.Validate(msg)
	if !valid {
		t.Error("nil authenticator should always validate")
	}
}

func TestAuthenticator_MissingUsername(t *testing.T) {
	auth := NewAuthenticator("secret")
	msg := &Message{Type: MsgTypeBindingRequest}
	valid, code, _ := auth.Validate(msg)
	if valid {
		t.Error("should fail without USERNAME")
	}
	if code != ErrBadRequest {
		t.Errorf("expected error code %d, got %d", ErrBadRequest, code)
	}
}

func TestRoundTrip(t *testing.T) {
	// Build a complete Binding Request with auth, parse it back.
	txID := NewTransactionID()
	key := []byte("mysecret")

	attrs := []Attribute{
		{Type: AttrUsername, Length: 8, Value: []byte("testuser")},
	}
	msg := BuildMessage(MsgTypeBindingRequest, txID, attrs)
	msg = ComputeMessageIntegrity(msg, key)
	msg = BuildFingerprint(msg)

	// Parse it back.
	parsed, err := ParseMessage(msg)
	if err != nil {
		t.Fatalf("failed to parse round-trip message: %v", err)
	}
	if parsed.Type != MsgTypeBindingRequest {
		t.Errorf("wrong type after round-trip")
	}
	if parsed.GetUsername() != "testuser" {
		t.Errorf("wrong username after round-trip: %s", parsed.GetUsername())
	}
	if !VerifyMessageIntegrity(parsed.Raw, key) {
		t.Error("message integrity failed after round-trip")
	}
	if !VerifyFingerprint(parsed.Raw) {
		t.Error("fingerprint failed after round-trip")
	}
}
