# Interactive Classroom Video Chat - Implementation Plan

## 📊 Project Status

**Current Phase:** Planning Complete
**Started:** 2025-11-12
**Last Updated:** 2025-11-12
**Overall Progress:** 0% (0/6 phases complete)

**Decision Made:** Starting with P2P (Mesh) architecture for Phase 1

---

## 📋 Quick Progress Tracker

- [ ] **Phase 1:** Prerequisites & Permissions (0/5)
- [ ] **Phase 2:** Backend Signaling Infrastructure (0/4)
- [ ] **Phase 3:** Frontend WebRTC Implementation (0/12)
- [ ] **Phase 4:** STUN/TURN Server Setup (0/1)
- [ ] **Phase 5:** UI/UX & Controls (0/7)
- [ ] **Phase 6:** Testing & Optimization (0/13)

---

## 🎯 Executive Summary

This plan outlines the implementation of real-time video and audio functionality for the Interactive Classroom feature. Students and teachers will be able to see and hear each other during live sessions.

### Key Features
- Real-time video and audio streaming
- Multi-participant support (optimized for 2-8 participants)
- Mute/unmute controls
- Camera on/off controls
- Device selection (multiple cameras/mics)
- Connection status indicators

---

## 🔍 Technical Approach Comparison

### Option 1: Peer-to-Peer (P2P) with WebRTC ✅ **SELECTED**

**How it works:**
- Direct media streams between browser clients
- Use STUN/TURN servers for NAT traversal
- Backend only handles signaling (connection establishment)
- Media flows directly between participants

**Pros:**
- ✅ **Low latency** - Direct connections = minimal delay (~50-150ms)
- ✅ **Reduced server costs** - Media doesn't go through your servers
- ✅ **Better quality** - No transcoding/processing overhead
- ✅ **Scalability** - Server load only for signaling, not media
- ✅ **Built for WebRTC** - This is the intended use case

**Cons:**
- ❌ **Complex with many participants** - Each peer needs connections to all others (N×(N-1)/2 connections)
- ❌ **Client bandwidth intensive** - Each client uploads video to every other participant
- ❌ **NAT/firewall issues** - ~8-15% of users may have connection problems
- ❌ **No recording/processing** - Can't easily record or process streams server-side
- ❌ **Security concerns** - Participants learn each other's IP addresses

**Best for:** Small classes (2-8 participants)

---

### Option 2: Selective Forwarding Unit (SFU) - Server-Routed

**How it works:**
- Clients send video once to the server
- Server forwards (not transcodes) streams to other participants
- Backend acts as a media router
- Uses WebRTC but with centralized architecture

**Pros:**
- ✅ **Scales better** - Each client only uploads once regardless of participant count
- ✅ **Easier recording** - Server has access to all streams
- ✅ **Better reliability** - Server handles NAT traversal centrally
- ✅ **Privacy** - Clients don't see each other's IPs
- ✅ **Flexibility** - Can add features like recording, AI processing, layouts
- ✅ **Quality control** - Server can adapt streams per recipient

**Cons:**
- ❌ **Higher server costs** - Need media servers with good bandwidth
- ❌ **Increased latency** - Extra hop adds 50-100ms
- ❌ **Infrastructure complexity** - Need to run/maintain media servers
- ❌ **Bandwidth costs** - All media flows through your infrastructure

**Best for:** Medium to large classes (5-50+ participants)

**Status:** Planned for Phase 2 (future enhancement)

---

### Option 3: Multipoint Control Unit (MCU) - Full Server Processing

**Status:** ❌ Not recommended for this use case

---

## 🎯 Recommendation: Hybrid Approach

### Phase 1: Start with P2P (Mesh) ← **WE ARE HERE**
- Simpler to implement initially
- Works great for 1-on-1 tutoring and small classes
- Lower infrastructure costs while building

### Phase 2: Add SFU for Scale (Future)
- Automatically switch to SFU when >5 participants join
- Or provide class size configuration
- Use a managed service like **LiveKit**, **Agora**, or **Daily.co**

**Rationale:**
- Most tutoring scenarios are 1-on-1 or small groups (P2P shines here)
- Large classes can use SFU mode
- Managed services handle the hard parts (TURN servers, SFU infrastructure)
- Can start with P2P and migrate gradually

---

## 📝 Implementation Plan

### Phase 1: Prerequisites & Permissions

**Estimated Time:** Week 1
**Status:** Not Started

#### Frontend Permission Handling

- [ ] Create `useMediaPermissions` hook for webcam/microphone access
  - [ ] Request camera permission
  - [ ] Request microphone permission
  - [ ] Handle permission state changes
  - [ ] Return permission status and helper functions

- [ ] Build permission request UI before entering classroom
  - [ ] Create `PermissionGate.jsx` component
  - [ ] Design permission request modal
  - [ ] Add permission icons and messaging
  - [ ] Show current permission status

- [ ] Handle permission denied/blocked scenarios
  - [ ] Show helpful error messages
  - [ ] Provide instructions to enable permissions
  - [ ] Allow retry after fixing permissions
  - [ ] Graceful degradation (audio-only mode)

- [ ] Add device selection (multiple cameras/mics)
  - [ ] Enumerate available devices
  - [ ] Create device selector dropdown
  - [ ] Handle device changes (plug/unplug)
  - [ ] Show device names/labels

- [ ] Store user preferences (default devices)
  - [ ] Save to localStorage
  - [ ] Restore on next session
  - [ ] Clear preferences option

**Files to create:**
- `frontend/src/hooks/useMediaPermissions.js`
- `frontend/src/components/InteractiveClassroom/PermissionGate.jsx`
- `frontend/src/components/InteractiveClassroom/DeviceSelector.jsx`

---

### Phase 2: Backend Infrastructure (P2P Signaling)

**Estimated Time:** Week 1-2
**Status:** Not Started

#### WebSocket Consumer for WebRTC Signaling

- [ ] Create `VideoConsumer` in `backend/consumers.py`
  - [ ] Handle connection/disconnection
  - [ ] Maintain room participant list
  - [ ] Broadcast participant join/leave events

- [ ] Handle WebRTC signaling messages
  - [ ] Receive and forward SDP offers
  - [ ] Receive and forward SDP answers
  - [ ] Receive and forward ICE candidates
  - [ ] Handle signaling errors

- [ ] Room management (who's in the call)
  - [ ] Track active participants
  - [ ] Send participant list to new joiners
  - [ ] Clean up on disconnect

- [ ] Track connection states
  - [ ] Log connection attempts
  - [ ] Track successful connections
  - [ ] Monitor connection health

**Signaling Flow:**
```
1. User A joins → creates offer
2. Backend broadcasts offer to room
3. User B receives offer → creates answer
4. Backend sends answer to User A
5. ICE candidates exchanged through backend
6. P2P connection established directly
```

**Files to modify:**
- `backend/lessonbase/backend/consumers.py` - Add `VideoConsumer` class
- `backend/lessonbase/backend/routing.py` - Add video WebSocket route

---

### Phase 3: Frontend WebRTC Implementation

**Estimated Time:** Week 2-3
**Status:** Not Started

#### Core WebRTC Service

- [ ] Create `webrtcService.js` for WebRTC peer connections
  - [ ] Initialize peer connection with ICE servers
  - [ ] Handle connection state changes
  - [ ] Implement connection cleanup

- [ ] Handle ICE candidate gathering
  - [ ] Listen for ICE candidates
  - [ ] Send candidates through signaling server
  - [ ] Handle received candidates from peers

- [ ] Manage multiple peer connections (one per participant)
  - [ ] Create peer connection for each participant
  - [ ] Track connections by participant ID
  - [ ] Handle participant leave (close connections)

- [ ] Stream management (add/remove tracks)
  - [ ] Add local tracks to peer connections
  - [ ] Handle remote track events
  - [ ] Replace tracks (camera/mic changes)
  - [ ] Stop tracks on disconnect

#### Video Chat Component Overhaul

- [ ] Replace placeholder `VideoChat` component
  - [ ] Remove placeholder content
  - [ ] Add WebRTC service integration
  - [ ] Connect to video WebSocket

- [ ] Create video grid layout (multiple participants)
  - [ ] Create `VideoGrid.jsx` component
  - [ ] Implement responsive grid (1, 2, 4, 6+ participants)
  - [ ] Handle dynamic participant addition/removal

- [ ] Add local video preview
  - [ ] Show local camera feed
  - [ ] Add "You" label
  - [ ] Muted by default (no echo)

- [ ] Remote video displays
  - [ ] Create `VideoTile.jsx` component
  - [ ] Show participant name/label
  - [ ] Display connection status
  - [ ] Handle video track start/stop

- [ ] Connection status indicators
  - [ ] Show connecting/connected/disconnected states
  - [ ] Display network quality indicator
  - [ ] Show loading spinner during connection

#### UI Controls

- [ ] Mute/unmute microphone button
  - [ ] Toggle audio track enabled state
  - [ ] Update button icon/state
  - [ ] Show muted indicator on video tile

- [ ] Enable/disable camera button
  - [ ] Toggle video track enabled state
  - [ ] Update button icon/state
  - [ ] Show "camera off" placeholder

- [ ] Switch camera (front/back on mobile)
  - [ ] Detect available cameras
  - [ ] Switch between cameras
  - [ ] Replace video track in peer connections

- [ ] Volume indicators
  - [ ] Audio level visualization
  - [ ] Show speaking indicator
  - [ ] Per-participant indicators

- [ ] Screen share button (future enhancement)
  - [ ] Placeholder for future implementation

**Files to create:**
- `frontend/src/services/webrtcService.js`
- `frontend/src/services/videoSocket.js`
- `frontend/src/components/InteractiveClassroom/VideoChat/VideoGrid.jsx`
- `frontend/src/components/InteractiveClassroom/VideoChat/VideoTile.jsx`
- `frontend/src/components/InteractiveClassroom/VideoChat/MediaControls.jsx`

**Files to modify:**
- `frontend/src/components/InteractiveClassroom/VideoChat.jsx` - Complete implementation

---

### Phase 4: STUN/TURN Server Setup

**Estimated Time:** Week 2
**Status:** Not Started

**Required for P2P NAT traversal**

- [ ] Configure ICE servers in frontend
  - Start with free STUN servers (Google)
  - Add TURN if NAT traversal issues occur

**Options:**

1. **Free STUN servers** (Google, Twilio) - Works for 85% of cases
   ```javascript
   iceServers: [
     { urls: 'stun:stun.l.google.com:19302' }
   ]
   ```

2. **Self-hosted TURN** - For enterprise control
   - Install `coturn` on a VPS
   - Configure credentials
   - Set up in backend environment variables
   - Provide credentials to frontend

3. **Managed service** - Twilio, Xirsys
   - Get TURN credentials via API
   - Pass to frontend dynamically
   - Rotate credentials regularly

**Recommendation:** Start with free STUN, add managed TURN if needed

---

### Phase 5: Room Entry Flow

**Visual Flow Diagram:**
```
User clicks "Join Classroom"
    ↓
Check permissions (camera/mic)
    ↓ (granted)
Request device access
    ↓
Show preview + device selection
    ↓
User clicks "Enter Classroom"
    ↓
Connect to WebSocket (chat, whiteboard, video)
    ↓
Send "join" message with user info
    ↓
Receive list of existing participants
    ↓
Create peer connections to each participant
    ↓
Exchange offers/answers/ICE through WebSocket
    ↓
P2P media streams established
    ↓
Display remote videos in grid
```

---

### Phase 6: Implementation Steps (Detailed Breakdown)

#### Step 1: Permission Infrastructure (Week 1)

**Status:** Not Started

- [ ] Create permission request hook
  - [ ] Implement `useMediaPermissions.js`
  - [ ] Test permission request flow
  - [ ] Handle all permission states

- [ ] Build permission UI/gate component
  - [ ] Design and implement `PermissionGate.jsx`
  - [ ] Add helpful messaging
  - [ ] Test user experience

- [ ] Test on various browsers
  - [ ] Chrome (desktop/mobile)
  - [ ] Firefox (desktop/mobile)
  - [ ] Safari (desktop/mobile)
  - [ ] Edge

---

#### Step 2: Backend Signaling (Week 1-2)

**Status:** Not Started

- [ ] Implement `VideoConsumer`
  - [ ] Create consumer class
  - [ ] Add to consumers.py
  - [ ] Implement message handlers

- [ ] Add routing
  - [ ] Add video WebSocket route to routing.py
  - [ ] Test WebSocket connection

- [ ] Test signaling messages with console logs
  - [ ] Log all incoming/outgoing messages
  - [ ] Verify message structure
  - [ ] Test with multiple clients

---

#### Step 3: Basic P2P Connection (Week 2)

**Status:** Not Started

- [ ] Implement `webrtcService.js`
  - [ ] Create service class
  - [ ] Implement peer connection management
  - [ ] Add event handlers

- [ ] Get one 1-on-1 connection working
  - [ ] Test offer/answer exchange
  - [ ] Verify ICE candidate exchange
  - [ ] Confirm media tracks received

- [ ] Test with local video streams
  - [ ] Show local video
  - [ ] Show remote video
  - [ ] Verify audio works

---

#### Step 4: Multi-Participant Support (Week 3)

**Status:** Not Started

- [ ] Handle multiple peer connections
  - [ ] Create connection per participant
  - [ ] Track all active connections
  - [ ] Handle connection lifecycle

- [ ] Build video grid layout
  - [ ] Implement responsive grid
  - [ ] Test with 2, 3, 4, 5+ participants
  - [ ] Optimize layout algorithm

- [ ] Test with 3-4 participants
  - [ ] Verify all connections work
  - [ ] Check performance
  - [ ] Test join/leave scenarios

---

#### Step 5: UI/UX Polish (Week 3-4)

**Status:** Not Started

- [ ] Add media controls (mute/unmute)
  - [ ] Implement mute button
  - [ ] Update UI state
  - [ ] Test toggle functionality

- [ ] Connection indicators
  - [ ] Show connection status
  - [ ] Add loading states
  - [ ] Display error states

- [ ] Error handling and reconnection logic
  - [ ] Handle connection failures
  - [ ] Implement auto-reconnect
  - [ ] Show user-friendly errors

- [ ] Mobile responsive design
  - [ ] Test on mobile browsers
  - [ ] Optimize for touch
  - [ ] Adjust layout for small screens

---

#### Step 6: Testing & Optimization (Week 4)

**Status:** Not Started

##### Functional Testing

- [ ] 1-on-1 video works
- [ ] Multiple participants (3-5) works
- [ ] Audio sync with video
- [ ] Mute/unmute functions work correctly
- [ ] Camera on/off functions work correctly
- [ ] Reconnection after network drop
- [ ] Permission denied handling

##### Browser Testing

- [ ] Chrome (desktop)
- [ ] Chrome (mobile)
- [ ] Firefox (desktop)
- [ ] Firefox (mobile)
- [ ] Safari (desktop)
- [ ] Safari (mobile - iOS)
- [ ] Edge (desktop)

##### Network Testing

- [ ] Good connection (>5 Mbps)
- [ ] Poor connection (<1 Mbps)
- [ ] Connection drops/recovery
- [ ] Firewall/NAT traversal
- [ ] High latency scenarios

##### Performance Testing

- [ ] Bandwidth optimization (adjust video quality)
- [ ] CPU usage monitoring
- [ ] Memory leak testing
- [ ] Battery usage on mobile

---

## 🛠 Technology Stack

### Frontend
- **WebRTC:** Native browser APIs
- **React:** Hooks for state management
- **Material-UI:** Controls and buttons
- **WebSocket:** Real-time signaling

### Backend
- **Django Channels:** WebSocket support (already in use)
- **AsyncWebsocketConsumer:** Video signaling consumer
- **Redis:** Channel layer backend (already configured)

### Infrastructure
- **STUN servers:** Google's free STUN
- **Optional TURN:** coturn or managed service (Twilio/Xirsys)

### Future (SFU Phase 2)
- **LiveKit** (recommended - open source + managed)
- **Mediasoup** (self-hosted, powerful)
- **Janus** (mature, complex)

---

## 💾 Database Considerations

### Phase 1 (P2P) - Minimal Changes

**Optional tables:**
- Track classroom participants (may already exist)
- Store user device preferences
- Log connection events for debugging

### Phase 2 (Future Recording Features)

**Additional tables:**
- Recording metadata
- Storage references (S3/local)
- Recording permissions/consent

---

## 🔒 Security & Privacy

- [ ] Verify user authentication before WebSocket connection
- [ ] Validate room membership server-side
- [ ] Use secure WebSocket (wss://)
- [ ] Encrypt signaling messages (done via WSS)
- [ ] Add recording consent notices (future)
- [ ] GDPR compliance for stored videos (future)

---

## ⚠️ Known Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Safari WebRTC quirks | Test early, use adapter.js library for cross-browser compatibility |
| Mobile bandwidth | Start with lower resolution (640x480), adaptive bitrate |
| Network failures | Implement automatic reconnection with exponential backoff |
| Echo/feedback | Use built-in echo cancellation (echoCancellation: true) |
| Multiple cameras | Add device selection UI with enumeration |
| Bandwidth scaling | Adjust resolution based on participant count |
| iOS restrictions | Test permission flow carefully, handle background mode |
| Firewall issues | Configure TURN server for NAT traversal |

---

## 📅 Estimated Timeline

### Phase 1 (P2P Implementation): 3-4 weeks

- **Week 1:** Permissions + Backend signaling
- **Week 2:** WebRTC service + Basic P2P
- **Week 3:** Multi-participant + UI
- **Week 4:** Testing + Polish

### Phase 2 (SFU Optional): 2-3 weeks (Future)

- Research and select SFU provider
- Integrate SDK
- Migration logic (P2P → SFU based on room size)
- Testing at scale

---

## 💰 Cost Estimates

### P2P Approach (Phase 1)

- **Server costs:** Minimal (only signaling)
- **STUN:** Free (Google)
- **TURN:** $20-50/month (Twilio/Xirsys) if needed
- **Total:** ~$0-50/month

### SFU Approach (Phase 2 - Future)

- **LiveKit Cloud:** ~$0.01 per participant-minute
- **Self-hosted:** $100-500/month (servers + bandwidth)
- **Depends on usage volume**

---

## 🎯 Final Recommendation Summary

### Start with P2P (mesh) architecture because:

1. ✅ Faster time to market (simpler implementation)
2. ✅ Lower costs initially
3. ✅ Sufficient for tutoring scenarios
4. ✅ Can always add SFU later

### Switch to SFU when:

- Classes regularly exceed 5-6 participants
- Need recording/processing features
- Want better NAT traversal reliability
- Budget allows for infrastructure

### Implementation approach:

- Build P2P signaling backend first
- Get 1-on-1 working, then scale to small groups
- Add SFU capability as a Phase 2 enhancement
- Use feature flags to enable SFU per classroom or subscription tier

---

## 📚 Additional Resources

### Documentation
- [WebRTC API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Django Channels Documentation](https://channels.readthedocs.io/)
- [adapter.js for cross-browser support](https://github.com/webrtcHacks/adapter)

### Libraries & Tools
- [simple-peer](https://github.com/feross/simple-peer) - Alternative WebRTC wrapper
- [coturn](https://github.com/coturn/coturn) - TURN server
- [LiveKit](https://livekit.io/) - Future SFU option

### Testing Tools
- Chrome DevTools WebRTC internals: `chrome://webrtc-internals/`
- Firefox WebRTC debugging: `about:webrtc`
- Network throttling in DevTools

---

## 📝 Notes for Future Sessions

### Current State
- Planning phase complete
- No implementation started yet
- Decision made: P2P first, SFU later

### Next Steps
1. Start with Phase 1: Permission infrastructure
2. Create `useMediaPermissions` hook
3. Build `PermissionGate` component

### Questions to Resolve
- Do we want to support screen sharing in Phase 1? (Recommend: Phase 2)
- Should we add chat notifications when someone joins/leaves video? (Recommend: Yes)
- Do we need recording from day 1? (Recommend: Phase 2)

---

**Last Updated:** 2025-11-12
**Author:** Claude Code
**Status:** Ready for Implementation
