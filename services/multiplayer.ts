import { 
    collection, 
    doc, 
    setDoc, 
    updateDoc, 
    onSnapshot, 
    query, 
    where, 
    serverTimestamp, 
    getDoc,
    deleteDoc,
    Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface NetworkPayload {
    type: 'SYNC_STATE' | 'GAME_SYNC' | 'MAP_DATA_SYNC' | 'INPUT_MOVE' | 'INPUT_BATTLE_ACTION' | 'INPUT_MENU' | 'INPUT_EMOTE' | 'BATTLE_REQUEST' | 'BATTLE_ACCEPT' | 'BATTLE_ACTION' | 'BATTLE_START' | 'TRADE_EVENT';
    payload: any;
}

enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
            emailVerified: auth.currentUser?.emailVerified,
        },
        operationType,
        path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
}

export class MultiplayerService {
    roomId: string | null = null;
    isHost: boolean = false;
    private dataListeners: ((data: NetworkPayload) => void)[] = [];
    private persistentDataCache: Map<string, NetworkPayload> = new Map();
    private lastProcessedInputTimestamps: Map<string, number> = new Map();
    private lastProcessedSyncTimestamps: Map<string, number> = new Map();
    private lastProcessedTradeTimestamps: Map<string, number> = new Map();
    remotePlayers: Map<string, any> = new Map();
    onRemotePlayerUpdate: ((players: Map<string, any>) => void) | null = null;
    private unsubscribers: (() => void)[] = [];

    constructor() {}
    
    private sanitizeData(data: any): any {
        if (data === undefined) return null;
        if (data === null) return null;
        if (Array.isArray(data)) return data.map(item => this.sanitizeData(item));
        if (typeof data === 'object') {
            const sanitized: any = {};
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    const value = this.sanitizeData(data[key]);
                    if (value !== undefined) {
                        sanitized[key] = value;
                    }
                }
            }
            return sanitized;
        }
        return data;
    }

    async createRoom(): Promise<string> {
        if (!auth.currentUser) throw new Error("User must be authenticated.");
        
        const uid = auth.currentUser.uid;
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let roomId = '';
        for (let i = 0; i < 6; i++) roomId += chars.charAt(Math.floor(Math.random() * chars.length));
        
        console.log(`[MULTIPLAYER] Creating room: ${roomId}`);
        this.roomId = roomId;
        this.isHost = true;
        const roomRef = doc(db, 'rooms', roomId);
        
        await this.setupListeners(roomId, uid);
        
        await setDoc(roomRef, {
            hostId: uid,
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp()
        });
        
        return roomId;
    }

    async joinRoom(roomId: string): Promise<string> {
        if (!auth.currentUser) throw new Error("User must be authenticated.");
        const uid = auth.currentUser.uid;
        const cleanRoomId = roomId.trim().toUpperCase();
        
        console.log(`[MULTIPLAYER] Joining room: ${cleanRoomId}`);
        const roomRef = doc(db, 'rooms', cleanRoomId);
        const roomSnap = await getDoc(roomRef);
        
        if (!roomSnap.exists()) {
            throw new Error("Room not found. Check the code and try again.");
        }
        
        this.roomId = cleanRoomId;
        this.isHost = roomSnap.data().hostId === uid;
        
        await this.setupListeners(cleanRoomId, uid);
        return uid;
    }

    private async setupListeners(roomId: string, uid: string) {
        const playerRef = doc(db, 'rooms', roomId, 'players', uid);
        const roomRef = doc(db, 'rooms', roomId);

        console.log(`[MULTIPLAYER] Setting up listeners for room: ${roomId}`);

        // 1. Listen for room updates (GAME_SYNC) - Setup BEFORE player state to catch initial data
        const unsubRoom = onSnapshot(roomRef, (snap) => {
            const data = snap.data();
            if (data) {
                // Emit persistent data first
                Object.keys(data).forEach(key => {
                    if (key.startsWith('persistent_')) {
                        const pData = data[key];
                        if (pData.senderId !== uid) {
                            console.log(`[MULTIPLAYER] Received persistent data from other: ${key}`);
                            this.emitData({ type: 'GAME_SYNC', payload: pData });
                        }
                    }
                });
                // Then emit the last transient sync
                if (data.gameSync && data.gameSync.senderId !== uid) {
                    this.emitData({ type: 'GAME_SYNC', payload: data.gameSync.payload });
                }
            }
        }, (err) => handleFirestoreError(err, OperationType.GET, `rooms/${roomId}`));
        this.unsubscribers.push(unsubRoom);

        // 2. Set Player State
        await setDoc(playerRef, {
            uid: uid,
            displayName: auth.currentUser?.displayName || 'Trainer',
            state: {},
            lastUpdate: serverTimestamp()
        });

        // 3. Listen for other players
        const playersQuery = collection(db, 'rooms', roomId, 'players');
        const unsubPlayers = onSnapshot(playersQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const data = change.doc.data();
                if (data.uid !== uid) {
                    if (change.type === 'removed') {
                        this.remotePlayers.delete(data.uid);
                    } else {
                        this.remotePlayers.set(data.uid, data.state);
                        
                        // Handle Transient Sync via Player Document
                        if (data.lastSync && (!this.lastProcessedSyncTimestamps.has(data.uid) || data.lastSync.timestamp?.toMillis() > this.lastProcessedSyncTimestamps.get(data.uid))) {
                            this.lastProcessedSyncTimestamps.set(data.uid, data.lastSync.timestamp?.toMillis() || 0);
                            console.log(`[MULTIPLAYER] Received transient sync from ${data.uid}:`, data.lastSync.payload.type);
                            this.emitData({ type: 'GAME_SYNC', payload: data.lastSync.payload });
                        }

                        // Handle Inputs
                        if (data.lastInput && (!this.lastProcessedInputTimestamps.has(data.uid) || data.lastInput.timestamp?.toMillis() > this.lastProcessedInputTimestamps.get(data.uid))) {
                            this.lastProcessedInputTimestamps.set(data.uid, data.lastInput.timestamp?.toMillis() || 0);
                            this.emitData({ type: data.lastInput.type, payload: data.lastInput.payload });
                        }

                        // Handle Trade Events (separate channel from normal inputs so stray trade
                        // chatter can't clobber per-tick movement inputs and vice versa).
                        if (data.lastTradeInput && (!this.lastProcessedTradeTimestamps.has(data.uid) || data.lastTradeInput.timestamp?.toMillis() > this.lastProcessedTradeTimestamps.get(data.uid))) {
                            this.lastProcessedTradeTimestamps.set(data.uid, data.lastTradeInput.timestamp?.toMillis() || 0);
                            this.emitData({ type: 'TRADE_EVENT', payload: { ...data.lastTradeInput.payload, fromUid: data.uid } });
                        }
                    }
                }
            });
            if (this.onRemotePlayerUpdate) {
                this.onRemotePlayerUpdate(this.remotePlayers);
            }
        }, (err) => handleFirestoreError(err, OperationType.LIST, `rooms/${roomId}/players`));
        this.unsubscribers.push(unsubPlayers);

        // 4. Listen for battles
        const battlesQuery = collection(db, 'rooms', roomId, 'battles');
        const unsubBattles = onSnapshot(battlesQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const data = change.doc.data();
                // In co-op, we want all players to potentially see and join battles
                const isParticipant = data.challengerId === uid || data.acceptorId === uid;
                const isWildBattle = !data.challengerId && !data.isPvP;

                if (isParticipant || isWildBattle) {
                    if (change.type === 'added') {
                        if (data.status === 'pending' && data.acceptorId === uid) {
                            this.emitData({ type: 'BATTLE_REQUEST', payload: { challengerId: data.challengerId, playerInfo: data.challengerInfo } });
                        }
                    } else if (change.type === 'modified') {
                        if (data.status === 'active') {
                            this.emitData({ 
                                type: 'BATTLE_ACCEPT', 
                                payload: { 
                                    battleId: change.doc.id,
                                    opponentId: data.challengerId === uid ? data.acceptorId : data.challengerId,
                                    opponentInfo: data.challengerId === uid ? data.acceptorInfo : data.challengerInfo,
                                    isLead: data.challengerId === uid
                                } 
                            });
                        }
                        if (data.lastAction && data.lastAction.senderId !== uid) {
                            this.emitData({ type: 'BATTLE_ACTION', payload: data.lastAction.action });
                        }
                        if (data.startData && data.startData.hostId !== uid) {
                            this.emitData({ type: 'BATTLE_START', payload: data.startData });
                        }
                    }
                }
            });
        }, (err) => handleFirestoreError(err, OperationType.LIST, `rooms/${roomId}/battles`));
        this.unsubscribers.push(unsubBattles);
    }

    async initialize(roomId: string): Promise<string> {
        return this.joinRoom(roomId);
    }

    private emitData(data: NetworkPayload) {
        if (!data || !data.type) {
            console.warn("[MULTIPLAYER] Attempted to emit invalid data:", data);
            return;
        }

        if (data.type === 'INPUT_MOVE') {
            console.log("[MULTIPLAYER] Emitting INPUT_MOVE to listeners");
        }

        if (data.payload?.isPersistent) {
            console.log(`[MULTIPLAYER] Caching persistent data: ${data.payload.type}`);
            this.persistentDataCache.set(data.payload.type, data);
        }
        
        console.log(`[MULTIPLAYER] Emitting data to ${this.dataListeners.length} listeners:`, data.type, data.payload?.type);
        this.dataListeners.forEach(cb => {
            try {
                cb(data);
            } catch (err) {
                console.error("[MULTIPLAYER] Error in data listener:", err);
            }
        });
    }

    async send(data: NetworkPayload) {
        if (!this.roomId || !auth.currentUser) return;
        const uid = auth.currentUser.uid;

        try {
            if (data.type === 'SYNC_STATE') {
                const playerRef = doc(db, 'rooms', this.roomId, 'players', uid);
                await updateDoc(playerRef, {
                    state: this.sanitizeData(data.payload),
                    lastUpdate: serverTimestamp()
                });
            } else if (data.type === 'GAME_SYNC') {
                if (data.payload.isPersistent) {
                    // Persistent Sync -> Room Document (Host Only)
                    if (!this.isHost) {
                        console.warn("[MULTIPLAYER] Client attempted to send persistent sync. Ignored.");
                        return;
                    }
                    const roomRef = doc(db, 'rooms', this.roomId);
                    const update: any = {
                        gameSync: {
                            senderId: uid,
                            payload: this.sanitizeData(data.payload),
                            timestamp: serverTimestamp()
                        }
                    };
                    const persistentPayload = this.sanitizeData({ ...data.payload, senderId: uid });
                    update[`persistent_${data.payload.type}`] = persistentPayload;
                    // Optimistically update cache
                    this.persistentDataCache.set(data.payload.type, { type: 'GAME_SYNC', payload: persistentPayload });
                    await updateDoc(roomRef, update);
                } else {
                    // Transient Sync -> Player Document (Anyone)
                    const playerRef = doc(db, 'rooms', this.roomId, 'players', uid);
                    await updateDoc(playerRef, {
                        lastSync: {
                            payload: this.sanitizeData(data.payload),
                            timestamp: serverTimestamp()
                        }
                    });
                }
            } else if (data.type === 'BATTLE_REQUEST') {
                const battleId = `battle_${uid}_${data.payload.targetId}`;
                const battleRef = doc(db, 'rooms', this.roomId, 'battles', battleId);
                await setDoc(battleRef, {
                    challengerId: uid,
                    acceptorId: data.payload.targetId,
                    challengerInfo: data.payload.playerInfo,
                    status: 'pending',
                    createdAt: serverTimestamp()
                });
            } else if (data.type === 'BATTLE_ACCEPT') {
                const battleRef = doc(db, 'rooms', this.roomId, 'battles', data.payload.battleId);
                await updateDoc(battleRef, {
                    status: 'active',
                    acceptorInfo: data.payload.acceptorInfo,
                    challengerInfo: data.payload.challengerInfo // Ensure both are present
                });
            } else if (data.type === 'BATTLE_ACTION') {
                const battleRef = doc(db, 'rooms', this.roomId, 'battles', data.payload.battleId);
                await updateDoc(battleRef, {
                    lastAction: {
                        senderId: uid,
                        action: this.sanitizeData(data.payload.action)
                    }
                });
            } else if (data.type === 'BATTLE_START') {
                const battleRef = doc(db, 'rooms', this.roomId, 'battles', data.payload.battleId);
                await setDoc(battleRef, {
                    startData: this.sanitizeData({
                        ...data.payload,
                        hostId: uid
                    }),
                    status: 'active',
                    updatedAt: serverTimestamp(),
                    createdAt: serverTimestamp()
                }, { merge: true });

                // Also broadcast as transient sync for immediate notification to all players in room
                const playerRef = doc(db, 'rooms', this.roomId, 'players', uid);
                await updateDoc(playerRef, {
                    lastSync: {
                        payload: {
                            type: 'BATTLE_START',
                            ...this.sanitizeData(data.payload)
                        },
                        timestamp: serverTimestamp()
                    }
                });
            } else if (data.type === 'TRADE_EVENT') {
                const playerRef = doc(db, 'rooms', this.roomId, 'players', uid);
                await updateDoc(playerRef, {
                    lastTradeInput: {
                        payload: this.sanitizeData(data.payload),
                        timestamp: serverTimestamp()
                    }
                });
            } else if (data.type === 'INPUT_BATTLE_ACTION' || data.type === 'INPUT_MENU' || data.type === 'INPUT_MOVE') {
                const playerRef = doc(db, 'rooms', this.roomId, 'players', uid);
                await updateDoc(playerRef, {
                    lastInput: {
                        type: data.type,
                        payload: this.sanitizeData(data.payload),
                        timestamp: serverTimestamp()
                    }
                });
            }
        } catch (error) {
            console.error("[MULTIPLAYER] Send error:", error);
        }
    }

    onData(cb: (data: NetworkPayload) => void) {
        console.log("[MULTIPLAYER] New data listener attached");
        this.dataListeners.push(cb);
        
        // Replay persistent data to new listener
        if (this.persistentDataCache.size > 0) {
            console.log(`[MULTIPLAYER] Replaying ${this.persistentDataCache.size} persistent items to new listener`);
            this.persistentDataCache.forEach(data => {
                try {
                    cb(data);
                } catch (err) {
                    console.error("[MULTIPLAYER] Error replaying data:", err);
                }
            });
        }
        
        return () => {
            this.dataListeners = this.dataListeners.filter(l => l !== cb);
        };
    }

    onPlayersUpdate(cb: (players: Map<string, any>) => void) {
        this.onRemotePlayerUpdate = cb;
    }

    disconnect() {
        console.log("[MULTIPLAYER] Disconnecting and clearing state");
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
        this.dataListeners = [];
        this.roomId = null;
        this.isHost = false;
        this.remotePlayers.clear();
        this.persistentDataCache.clear();
        this.lastProcessedInputTimestamps.clear();
        this.lastProcessedSyncTimestamps.clear();
    }
}

export const multiplayer = new MultiplayerService();
