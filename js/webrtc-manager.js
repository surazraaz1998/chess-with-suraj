/**
 * CYBER CHESS - WebRTC Peer-to-Peer Multiplayer Manager
 * Powered by PeerJS with public STUN servers for NAT traversal.
 * Enables 2 players in different locations to connect directly via WebRTC DataChannels.
 */

class WebRTCManager {
  constructor(chessApp) {
    this.app = chessApp;
    this.peer = null;
    this.conn = null;
    this.myPeerId = null;
    this.roomId = null;
    this.isHost = false;
    this.isConnected = false;
    this.myColor = 'w'; // 'w' (Host) or 'b' (Guest)
    this.opponentName = 'Remote Opponent';
    this.myName = localStorage.getItem('chess_player_name') || `Player_${Math.floor(Math.random() * 900 + 100)}`;

    // STUN configuration for NAT traversal
    this.peerConfig = {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      }
    };
  }

  // Generate clean room ID (e.g. CYBER-7492)
  generateRoomId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const num = Math.floor(Math.random() * 900 + 100);
    return `CHESS-${code}${num}`;
  }

  initPeer(customId = null, onReady = null, onError = null) {
    if (this.peer && !this.peer.destroyed) {
      if (onReady) onReady(this.myPeerId);
      return;
    }

    try {
      this.peer = customId
        ? new Peer(customId, this.peerConfig)
        : new Peer(this.peerConfig);

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        console.log('[WebRTC] Peer opened with ID:', id);
        if (onReady) onReady(id);
      });

      this.peer.on('connection', (connection) => {
        console.log('[WebRTC] Incoming connection from:', connection.peer);
        this.setupConnection(connection);
      });

      this.peer.on('error', (err) => {
        console.error('[WebRTC] Peer error:', err);
        if (onError) onError(err);
      });

      this.peer.on('disconnected', () => {
        console.warn('[WebRTC] Peer disconnected from signaling server.');
      });
    } catch (e) {
      console.error('[WebRTC] Failed to initialize Peer:', e);
      if (onError) onError(e);
    }
  }

  // Host creates room with clean ID
  createRoom(roomId = null, callbacks = {}) {
    this.isHost = true;
    this.myColor = 'w'; // Host plays White
    this.roomId = roomId || this.generateRoomId();
    const peerId = `cyberchess-${this.roomId.toLowerCase()}`;

    this.initPeer(peerId, 
      (id) => {
        console.log('[WebRTC] Room created:', this.roomId);
        if (callbacks.onRoomCreated) callbacks.onRoomCreated(this.roomId);
      },
      (err) => {
        // If peer ID is taken or error occurs, try generating a random room ID
        if (err.type === 'unavailable-id') {
          console.warn('[WebRTC] Room ID taken, retrying with new ID...');
          this.createRoom(this.generateRoomId(), callbacks);
        } else {
          if (callbacks.onError) callbacks.onError(err);
        }
      }
    );
  }

  // Guest joins an existing room by ID
  joinRoom(roomId, callbacks = {}) {
    this.isHost = false;
    this.myColor = 'b'; // Guest plays Black
    this.roomId = roomId.trim();
    const targetPeerId = `cyberchess-${this.roomId.toLowerCase()}`;

    this.initPeer(null, 
      (myId) => {
        console.log('[WebRTC] Connecting to room:', targetPeerId);
        const connection = this.peer.connect(targetPeerId, {
          reliable: true
        });

        this.setupConnection(connection, callbacks);
      },
      (err) => {
        if (callbacks.onError) callbacks.onError(err);
      }
    );
  }

  setupConnection(connection, callbacks = {}) {
    this.conn = connection;

    this.conn.on('open', () => {
      this.isConnected = true;
      console.log('[WebRTC] DataChannel open with peer!');

      // Send initial handshake
      this.send({
        type: 'HANDSHAKE',
        name: this.myName,
        isHost: this.isHost,
        timeControl: this.app.timeControl
      });

      if (callbacks.onConnected) callbacks.onConnected();
      this.app.onWebRTCConnected(this.isHost ? 'w' : 'b', this.roomId);
    });

    this.conn.on('data', (data) => {
      this.handleIncomingMessage(data);
    });

    this.conn.on('close', () => {
      this.isConnected = false;
      console.warn('[WebRTC] DataChannel closed.');
      this.app.onWebRTCDisconnected();
    });

    this.conn.on('error', (err) => {
      console.error('[WebRTC] Connection error:', err);
      if (callbacks.onError) callbacks.onError(err);
    });
  }

  send(payload) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(payload);
      } catch (err) {
        console.error('[WebRTC] Failed to send message:', err);
      }
    }
  }

  // --- Message Handling ---
  handleIncomingMessage(data) {
    console.log('[WebRTC] Received message:', data.type, data);

    switch (data.type) {
      case 'HANDSHAKE':
        this.opponentName = data.name || 'Opponent';
        if (this.isHost) {
          // Host sends game settings confirmation to guest
          this.send({
            type: 'GAME_CONFIG',
            timeControl: this.app.timeControl,
            fen: this.app.engine.exportFEN(),
            hostName: this.myName
          });
        }
        this.app.updateOpponentDetails(this.opponentName);
        break;

      case 'GAME_CONFIG':
        this.opponentName = data.hostName || 'Host';
        this.app.timeControl = data.timeControl;
        this.app.updateOpponentDetails(this.opponentName);
        this.app.setupNewGame();
        break;

      case 'MOVE':
        // Opponent made a move on their board
        this.app.receiveRemoteMove(data.move, data.timers);
        break;

      case 'DRAW_OFFER':
        this.app.receiveDrawOffer();
        break;

      case 'DRAW_RESPONSE':
        if (data.accepted) {
          this.app.handleRemoteDrawAccepted();
        } else {
          this.app.showToast('Opponent declined the draw offer.');
        }
        break;

      case 'RESIGN':
        this.app.handleRemoteResignation();
        break;

      case 'REMATCH_REQUEST':
        this.app.receiveRematchRequest();
        break;

      case 'REMATCH_ACCEPT':
        // Swap colors for rematch
        this.myColor = this.myColor === 'w' ? 'b' : 'w';
        this.app.handleRemoteRematchAccepted(this.myColor);
        break;

      case 'CHAT':
        this.app.receiveChatMessage(data.text, data.sender);
        break;

      case 'CLOCK_SYNC':
        this.app.syncTimers(data.timers);
        break;
    }
  }

  // Protocol actions called from app.js
  sendMove(move, timers) {
    this.send({
      type: 'MOVE',
      move,
      timers
    });
  }

  sendDrawOffer() {
    this.send({ type: 'DRAW_OFFER' });
  }

  sendDrawResponse(accepted) {
    this.send({ type: 'DRAW_RESPONSE', accepted });
  }

  sendResign() {
    this.send({ type: 'RESIGN' });
  }

  sendRematchRequest() {
    this.send({ type: 'REMATCH_REQUEST' });
  }

  sendRematchAccept() {
    this.send({ type: 'REMATCH_ACCEPT' });
  }

  sendChat(text) {
    this.send({
      type: 'CHAT',
      text,
      sender: this.myName
    });
  }

  sendClockSync(timers) {
    this.send({
      type: 'CLOCK_SYNC',
      timers
    });
  }

  disconnect() {
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.isConnected = false;
    this.roomId = null;
  }
}

window.WebRTCManager = WebRTCManager;
