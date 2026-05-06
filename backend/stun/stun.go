package stun

import (
	"crypto/rand"
	"encoding/binary"
	"errors"
	"fmt"
	"hash/crc32"
	"net"
)

// STUN protocol constants per RFC 5389.
const (
	MagicCookie    uint32 = 0x2112A442
	HeaderSize            = 20
	FingerprintXOR uint32 = 0x5354554e
)

// STUN message types.
const (
	MsgTypeBindingRequest       uint16 = 0x0001
	MsgTypeBindingResponse      uint16 = 0x0101
	MsgTypeBindingErrorResponse uint16 = 0x0111
)

// STUN attribute types.
const (
	AttrMappedAddress    uint16 = 0x0001
	AttrUsername         uint16 = 0x0006
	AttrMessageIntegrity uint16 = 0x0008
	AttrErrorCode        uint16 = 0x0009
	AttrXORMappedAddress uint16 = 0x0020
	AttrSoftware         uint16 = 0x8022
	AttrFingerprint      uint16 = 0x8028
)

// Address families.
const (
	AddrFamilyIPv4 byte = 0x01
	AddrFamilyIPv6 byte = 0x02
)

// Error codes.
const (
	ErrBadRequest   = 400
	ErrUnauthorized = 401
	ErrServerError  = 500
)

// Message represents a parsed STUN message.
type Message struct {
	Type          uint16
	Length        uint16
	TransactionID [12]byte
	Attributes    []Attribute
	Raw           []byte // original raw bytes for integrity checks
}

// Attribute represents a STUN attribute.
type Attribute struct {
	Type   uint16
	Length uint16
	Value  []byte
}

// ParseMessage parses a raw STUN message from bytes.
func ParseMessage(data []byte) (*Message, error) {
	if len(data) < HeaderSize {
		return nil, errors.New("message too short")
	}

	// First two bits must be 0 per RFC 5389.
	if data[0]&0xC0 != 0 {
		return nil, errors.New("invalid STUN message: first two bits must be 0")
	}

	msg := &Message{
		Type:   binary.BigEndian.Uint16(data[0:2]),
		Length: binary.BigEndian.Uint16(data[2:4]),
		Raw:    make([]byte, len(data)),
	}
	copy(msg.Raw, data)

	// Verify magic cookie.
	cookie := binary.BigEndian.Uint32(data[4:8])
	if cookie != MagicCookie {
		return nil, errors.New("invalid magic cookie")
	}

	copy(msg.TransactionID[:], data[8:20])

	// Message length must be multiple of 4.
	if msg.Length%4 != 0 {
		return nil, errors.New("message length not a multiple of 4")
	}

	// Check that data has enough bytes for declared attributes.
	if int(msg.Length)+HeaderSize > len(data) {
		return nil, errors.New("message truncated")
	}

	// Parse attributes.
	offset := HeaderSize
	end := HeaderSize + int(msg.Length)
	for offset+4 <= end {
		attrType := binary.BigEndian.Uint16(data[offset : offset+2])
		attrLen := binary.BigEndian.Uint16(data[offset+2 : offset+4])

		// Padded length (align to 4 bytes).
		paddedLen := int(attrLen)
		if paddedLen%4 != 0 {
			paddedLen += 4 - paddedLen%4
		}

		if offset+4+int(attrLen) > end {
			return nil, errors.New("attribute truncated")
		}

		value := make([]byte, attrLen)
		copy(value, data[offset+4:offset+4+int(attrLen)])

		msg.Attributes = append(msg.Attributes, Attribute{
			Type:   attrType,
			Length: attrLen,
			Value:  value,
		})

		offset += 4 + paddedLen
	}

	return msg, nil
}

// GetAttribute returns the first attribute with the given type, or nil.
func (m *Message) GetAttribute(attrType uint16) *Attribute {
	for i := range m.Attributes {
		if m.Attributes[i].Type == attrType {
			return &m.Attributes[i]
		}
	}
	return nil
}

// GetUsername returns the USERNAME attribute value as a string, or empty.
func (m *Message) GetUsername() string {
	attr := m.GetAttribute(AttrUsername)
	if attr == nil {
		return ""
	}
	return string(attr.Value)
}

// BuildMessage constructs a STUN message from the given parameters.
func BuildMessage(msgType uint16, txID [12]byte, attrs []Attribute) []byte {
	// Calculate total attribute length.
	attrLen := 0
	for _, a := range attrs {
		padded := int(a.Length)
		if padded%4 != 0 {
			padded += 4 - padded%4
		}
		attrLen += 4 + padded
	}

	msg := make([]byte, HeaderSize+attrLen)
	binary.BigEndian.PutUint16(msg[0:2], msgType)
	binary.BigEndian.PutUint16(msg[2:4], uint16(attrLen))
	binary.BigEndian.PutUint32(msg[4:8], MagicCookie)
	copy(msg[8:20], txID[:])

	offset := HeaderSize
	for _, a := range attrs {
		binary.BigEndian.PutUint16(msg[offset:offset+2], a.Type)
		binary.BigEndian.PutUint16(msg[offset+2:offset+4], a.Length)
		copy(msg[offset+4:offset+4+int(a.Length)], a.Value)
		// Zero-fill padding.
		padded := int(a.Length)
		if padded%4 != 0 {
			padEnd := padded + (4 - padded%4)
			for i := int(a.Length); i < padEnd; i++ {
				msg[offset+4+i] = 0
			}
			padded = padEnd
		}
		offset += 4 + padded
	}

	return msg
}

// BuildXORMappedAddress creates an XOR-MAPPED-ADDRESS attribute for the given address.
func BuildXORMappedAddress(addr *net.UDPAddr, txID [12]byte) Attribute {
	ip4 := addr.IP.To4()
	if ip4 != nil {
		// IPv4: 1 byte reserved, 1 byte family, 2 bytes port, 4 bytes address = 8 bytes.
		value := make([]byte, 8)
		value[0] = 0x00
		value[1] = AddrFamilyIPv4
		// XOR port with top 16 bits of magic cookie.
		xPort := uint16(addr.Port) ^ uint16(MagicCookie>>16)
		binary.BigEndian.PutUint16(value[2:4], xPort)
		// XOR address with magic cookie.
		mcBytes := make([]byte, 4)
		binary.BigEndian.PutUint32(mcBytes, MagicCookie)
		for i := range 4 {
			value[4+i] = ip4[i] ^ mcBytes[i]
		}
		return Attribute{Type: AttrXORMappedAddress, Length: 8, Value: value}
	}

	// IPv6: 1 byte reserved, 1 byte family, 2 bytes port, 16 bytes address = 20 bytes.
	ip6 := addr.IP.To16()
	value := make([]byte, 20)
	value[0] = 0x00
	value[1] = AddrFamilyIPv6
	xPort := uint16(addr.Port) ^ uint16(MagicCookie>>16)
	binary.BigEndian.PutUint16(value[2:4], xPort)
	// XOR address with magic cookie + transaction ID.
	mcBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(mcBytes, MagicCookie)
	for i := 0; i < 4; i++ {
		value[4+i] = ip6[i] ^ mcBytes[i]
	}
	for i := 0; i < 12; i++ {
		value[8+i] = ip6[4+i] ^ txID[i]
	}
	return Attribute{Type: AttrXORMappedAddress, Length: 20, Value: value}
}

// BuildErrorCode creates an ERROR-CODE attribute.
func BuildErrorCode(code int, reason string) Attribute {
	class := code / 100
	number := code % 100
	// 4 bytes header + reason phrase.
	value := make([]byte, 4+len(reason))
	value[0] = 0
	value[1] = 0
	value[2] = byte(class)
	value[3] = byte(number)
	copy(value[4:], reason)
	return Attribute{Type: AttrErrorCode, Length: uint16(len(value)), Value: value}
}

// BuildSoftware creates a SOFTWARE attribute.
func BuildSoftware(name string) Attribute {
	return Attribute{Type: AttrSoftware, Length: uint16(len(name)), Value: []byte(name)}
}

// BuildFingerprint computes and appends a FINGERPRINT attribute.
// The input should be the message bytes built so far (without fingerprint).
// Returns the complete message with fingerprint appended.
func BuildFingerprint(msg []byte) []byte {
	// Update message length to include the fingerprint attribute (8 bytes: 4 header + 4 value).
	newLen := binary.BigEndian.Uint16(msg[2:4]) + 8
	binary.BigEndian.PutUint16(msg[2:4], newLen)

	// CRC-32 over the message with the updated length.
	crc := crc32.ChecksumIEEE(msg) ^ FingerprintXOR

	// Append fingerprint attribute.
	fp := make([]byte, 8)
	binary.BigEndian.PutUint16(fp[0:2], AttrFingerprint)
	binary.BigEndian.PutUint16(fp[2:4], 4)
	binary.BigEndian.PutUint32(fp[4:8], crc)

	return append(msg, fp...)
}

// VerifyFingerprint checks if the message has a valid FINGERPRINT attribute.
func VerifyFingerprint(data []byte) bool {
	if len(data) < HeaderSize+8 {
		return false
	}
	// Fingerprint is last 8 bytes.
	fpOffset := len(data) - 8
	attrType := binary.BigEndian.Uint16(data[fpOffset : fpOffset+2])
	if attrType != AttrFingerprint {
		return false
	}
	expected := binary.BigEndian.Uint32(data[fpOffset+4 : fpOffset+8])

	// Compute CRC-32 over everything before the fingerprint attribute.
	// But first, adjust the message length in the header to include only up to the fingerprint.
	check := make([]byte, fpOffset)
	copy(check, data[:fpOffset])
	// Message length should account for the fingerprint attribute itself.
	binary.BigEndian.PutUint16(check[2:4], uint16(fpOffset-HeaderSize+8))
	crc := crc32.ChecksumIEEE(check) ^ FingerprintXOR

	return crc == expected
}

// NewTransactionID generates a random 12-byte transaction ID.
func NewTransactionID() [12]byte {
	var id [12]byte
	_, _ = rand.Read(id[:])
	return id
}

// String returns a human-readable representation of the message type.
func MessageTypeName(t uint16) string {
	switch t {
	case MsgTypeBindingRequest:
		return "Binding Request"
	case MsgTypeBindingResponse:
		return "Binding Success Response"
	case MsgTypeBindingErrorResponse:
		return "Binding Error Response"
	default:
		return fmt.Sprintf("Unknown (0x%04x)", t)
	}
}
