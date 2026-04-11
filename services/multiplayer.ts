
import { io, Socket } from 'socket.io-client';

export interface NetworkPayload {
    type: 'SYNC_STATE' | 'GAME_SYNC' | 'INPUT_MOVE' | 'INPUT_BATTLE_ACTION' | 'INPUT_MENU' | 'INPUT_EMOTE' | 'BATTLE_REQUEST' | 'BATTLE_ACCEPT' | 'BATTLE_ACTION';
    payload: any;
}

export class MultiplayerService {
    socket: Socket | null = null;
    roomId: string | null = null;
    isHost: boolean = false;
    private dataListeners: ((data: NetworkPayload) => void)[] = [];
    remotePlayers: Map<string, any> = new Map();
    onRemotePlayerUpdate: ((players: Map<string, any>) => void) | null = null;

    constructor() {}

    async initialize(roomId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.socket) {
                this.socket.disconnect();
            }

            // Connect to the current origin (works for both local and deployed)
            this.socket = io(window.location.origin);

            this.socket.on('connect', () => {
                console.log('Connected to server with ID:', this.socket?.id);
                this.roomId = roomId;
                this.socket?.emit('join_room', roomId);
            });

            this.socket.on('room_joined', (data: { isHost: boolean }) => {
                this.isHost = data.isHost;
                console.log('Joined room as host:', this.isHost);
                resolve(this.socket!.id!);
            });

            this.socket.on('player_joined', (data) => {
                console.log('Player joined:', data.id);
            });

            this.socket.on('remote_player_update', (data) => {
                const { id, state } = data;
                this.remotePlayers.set(id, state);
                if (this.onRemotePlayerUpdate) {
                    this.onRemotePlayerUpdate(this.remotePlayers);
                }
            });

            this.socket.on('player_left', (data) => {
                this.remotePlayers.delete(data.id);
                if (this.onRemotePlayerUpdate) {
                    this.onRemotePlayerUpdate(this.remotePlayers);
                }
            });

            this.socket.on('battle_challenged', (data) => {
                this.emitData({ type: 'BATTLE_REQUEST', payload: data });
            });

            this.socket.on('battle_started', (data) => {
                this.emitData({ type: 'BATTLE_ACCEPT', payload: data });
            });

            this.socket.on('remote_battle_action', (data) => {
                this.emitData({ type: 'BATTLE_ACTION', payload: data.action });
            });

            this.socket.on('game_sync', (data) => {
                this.emitData({ type: 'GAME_SYNC', payload: data });
            });

            this.socket.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
                reject(err);
            });
        });
    }

    private emitData(data: NetworkPayload) {
        this.dataListeners.forEach(cb => cb(data));
    }

    send(data: NetworkPayload) {
        if (!this.socket || !this.roomId) return;

        if (data.type === 'SYNC_STATE') {
            this.socket.emit('update_state', { roomId: this.roomId, state: data.payload });
        } else if (data.type === 'GAME_SYNC') {
            this.socket.emit('game_sync', { roomId: this.roomId, state: data.payload });
        } else if (data.type === 'BATTLE_REQUEST') {
            this.socket.emit('battle_request', { roomId: this.roomId, targetId: data.payload.targetId, playerInfo: data.payload.playerInfo });
        } else if (data.type === 'BATTLE_ACCEPT') {
            this.socket.emit('battle_accept', { 
                roomId: this.roomId, 
                challengerId: data.payload.challengerId, 
                acceptorInfo: data.payload.acceptorInfo,
                challengerInfo: data.payload.challengerInfo
            });
        } else if (data.type === 'BATTLE_ACTION') {
            this.socket.emit('battle_action', { 
                roomId: this.roomId, 
                battleId: data.payload.battleId, 
                targetId: data.payload.targetId, 
                action: data.payload.action 
            });
        }
    }

    onData(cb: (data: NetworkPayload) => void) {
        this.dataListeners.push(cb);
        return () => {
            this.dataListeners = this.dataListeners.filter(l => l !== cb);
        };
    }

    onPlayersUpdate(cb: (players: Map<string, any>) => void) {
        this.onRemotePlayerUpdate = cb;
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
        this.roomId = null;
        this.remotePlayers.clear();
    }
}

export const multiplayer = new MultiplayerService();
