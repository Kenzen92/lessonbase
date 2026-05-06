package stun

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/binary"
)

// Authenticator handles STUN short-term credential validation.
type Authenticator struct {
	// CredentialLookup maps a username to its password/key.
	// For WebRTC ICE, the username is typically "ufrag:ufrag" and the
	// password is the ICE password.
	CredentialLookup func(username string) (password string, ok bool)
}

// NewAuthenticator creates an authenticator with a static shared secret.
// All usernames are accepted and the same secret is used as the HMAC key.
func NewAuthenticator(secret string) *Authenticator {
	return &Authenticator{
		CredentialLookup: func(username string) (string, bool) {
			if username == "" {
				return "", false
			}
			return secret, true
		},
	}
}

// Validate checks the MESSAGE-INTEGRITY of a STUN message using short-term credentials.
// Returns true if the message is authentic, or if no authentication is configured.
func (a *Authenticator) Validate(msg *Message) (bool, int, string) {
	if a == nil || a.CredentialLookup == nil {
		return true, 0, ""
	}

	username := msg.GetUsername()
	if username == "" {
		return false, ErrBadRequest, "Missing USERNAME"
	}

	password, ok := a.CredentialLookup(username)
	if !ok {
		return false, ErrUnauthorized, "Unknown user"
	}

	integrityAttr := msg.GetAttribute(AttrMessageIntegrity)
	if integrityAttr == nil {
		return false, ErrUnauthorized, "Missing MESSAGE-INTEGRITY"
	}

	// Verify HMAC-SHA1.
	// Per RFC 5389: The MESSAGE-INTEGRITY is computed over the STUN message
	// up to and including the attribute header of MESSAGE-INTEGRITY, with the
	// message length adjusted to point to the end of MESSAGE-INTEGRITY.
	if !VerifyMessageIntegrity(msg.Raw, []byte(password)) {
		return false, ErrUnauthorized, "Invalid MESSAGE-INTEGRITY"
	}

	return true, 0, ""
}

// VerifyMessageIntegrity checks the HMAC-SHA1 MESSAGE-INTEGRITY attribute.
func VerifyMessageIntegrity(raw []byte, key []byte) bool {
	// Find the MESSAGE-INTEGRITY attribute offset.
	if len(raw) < HeaderSize+4 {
		return false
	}

	offset := HeaderSize
	msgLen := int(binary.BigEndian.Uint16(raw[2:4]))
	end := HeaderSize + msgLen

	for offset+4 <= end {
		attrType := binary.BigEndian.Uint16(raw[offset : offset+2])
		attrLen := binary.BigEndian.Uint16(raw[offset+2 : offset+4])
		paddedLen := int(attrLen)
		if paddedLen%4 != 0 {
			paddedLen += 4 - paddedLen%4
		}

		if attrType == AttrMessageIntegrity {
			if attrLen != 20 {
				return false
			}
			// Extract the HMAC value from the message.
			if offset+4+20 > len(raw) {
				return false
			}
			receivedHMAC := raw[offset+4 : offset+4+20]

			// Build the data to HMAC: everything up to (not including) the
			// MESSAGE-INTEGRITY value, with the message length in the header
			// adjusted to include up to the end of MESSAGE-INTEGRITY.
			//
			// The "adjusted length" = offset of MI attr + 4 (attr header) + 20 (HMAC) - HeaderSize
			adjustedLen := uint16(offset + 4 + 20 - HeaderSize)

			buf := make([]byte, offset)
			copy(buf, raw[:offset])
			binary.BigEndian.PutUint16(buf[2:4], adjustedLen)

			mac := hmac.New(sha1.New, key)
			mac.Write(buf)
			computed := mac.Sum(nil)

			return hmac.Equal(receivedHMAC, computed)
		}

		offset += 4 + paddedLen
	}

	return false
}

// ComputeMessageIntegrity computes the HMAC-SHA1 for a message being built.
// msgSoFar is the message bytes built so far (without MESSAGE-INTEGRITY).
// Returns the complete message with MESSAGE-INTEGRITY appended.
func ComputeMessageIntegrity(msgSoFar []byte, key []byte) []byte {
	// Adjust message length to include the MESSAGE-INTEGRITY attribute
	// (4 byte header + 20 byte HMAC value = 24 bytes).
	adjustedLen := binary.BigEndian.Uint16(msgSoFar[2:4]) + 24

	buf := make([]byte, len(msgSoFar))
	copy(buf, msgSoFar)
	binary.BigEndian.PutUint16(buf[2:4], adjustedLen)

	mac := hmac.New(sha1.New, key)
	mac.Write(buf)
	computed := mac.Sum(nil)

	// Build the attribute.
	attr := make([]byte, 24)
	binary.BigEndian.PutUint16(attr[0:2], AttrMessageIntegrity)
	binary.BigEndian.PutUint16(attr[2:4], 20)
	copy(attr[4:24], computed)

	// Update original message length.
	binary.BigEndian.PutUint16(msgSoFar[2:4], adjustedLen)

	return append(msgSoFar, attr...)
}
