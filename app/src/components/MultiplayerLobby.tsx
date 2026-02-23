import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { ArrowLeft, Copy, Users, Wifi, WifiOff, Check, Gamepad2 } from 'lucide-react';
import type { Socket } from 'socket.io-client';

interface MultiplayerLobbyProps {
  onBack: () => void;
  onStartGame: () => void;
}

export function MultiplayerLobby({ onBack, onStartGame }: MultiplayerLobbyProps) {
  const { playerName, setIsHost, setRoomCode, setPlayer2Connected } = useGameStore();
  const [mode, setMode] = useState<'select' | 'host' | 'join' | 'join-input'>('select');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomCode, setLocalRoomCode] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Initialize socket connection
  useEffect(() => {
    // For this demo, we'll simulate socket behavior
    // In production, connect to actual WebSocket server
    const mockSocket = {
      on: (_event: string, _callback: (data: unknown) => void) => {
        // Mock implementation
      },
      emit: (_event: string, _data: unknown) => {
        // Mock implementation
      },
      disconnect: () => {
        // Mock implementation
      },
    } as unknown as Socket;

    setSocket(mockSocket);

    return () => {
      mockSocket.disconnect();
    };
  }, []);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleHostGame = () => {
    const code = generateRoomCode();
    setLocalRoomCode(code);
    setRoomCode(code);
    setIsHost(true);
    setMode('host');
    setConnected(true);

    // Simulate player 2 joining after random time (for demo)
    setTimeout(() => {
      setPlayer2Name('Player 2');
      setPlayer2Connected(true);
    }, 3000);
  };

  const handleJoinGame = () => {
    if (roomCodeInput.length !== 6) {
      setError('Please enter a valid 6-character room code');
      return;
    }
    setIsHost(false);
    setRoomCode(roomCodeInput.toUpperCase());
    setLocalRoomCode(roomCodeInput.toUpperCase());
    setMode('join');
    setConnected(true);
    setPlayer2Connected(true);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = () => {
    onStartGame();
  };

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-[#0A0A15] flex flex-col items-center justify-center p-4">
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-cyan-400 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            MULTIPLAYER
          </h2>
          <p className="text-white/60">Play with a friend online</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          <button
            onClick={handleHostGame}
            className={cn(
              "group flex flex-col items-center gap-4 p-8 rounded-xl",
              "bg-gradient-to-br from-cyan-900/50 to-blue-900/50",
              "border-2 border-cyan-500/50 hover:border-cyan-400",
              "transition-all duration-300 hover:scale-105"
            )}
          >
            <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Wifi className="w-10 h-10 text-cyan-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-1">Host Game</h3>
              <p className="text-white/60 text-sm">Create a room and invite a friend</p>
            </div>
          </button>

          <button
            onClick={() => setMode('join-input')}
            className={cn(
              "group flex flex-col items-center gap-4 p-8 rounded-xl",
              "bg-gradient-to-br from-pink-900/50 to-purple-900/50",
              "border-2 border-pink-500/50 hover:border-pink-400",
              "transition-all duration-300 hover:scale-105"
            )}
          >
            <div className="w-20 h-20 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Gamepad2 className="w-10 h-10 text-pink-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-1">Join Game</h3>
              <p className="text-white/60 text-sm">Enter a room code to play</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'join-input') {
    return (
      <div className="min-h-screen bg-[#0A0A15] flex flex-col items-center justify-center p-4">
        <button
          onClick={() => setMode('select')}
          className="absolute top-6 left-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-pink-400 mb-8 text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            JOIN GAME
          </h2>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <label className="text-white/80 text-sm mb-3 block">Enter Room Code</label>
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-4 text-2xl text-center tracking-[0.3em] text-white font-mono uppercase placeholder:text-white/20 focus:border-pink-400 focus:outline-none"
              maxLength={6}
            />

            {error && (
              <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
            )}

            <button
              onClick={handleJoinGame}
              disabled={roomCodeInput.length !== 6}
              className={cn(
                "w-full mt-6 py-4 rounded-lg font-bold text-lg",
                "bg-gradient-to-r from-pink-600 to-purple-600 text-white",
                "transition-all duration-300 hover:scale-[1.02]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A15] flex flex-col items-center justify-center p-4">
      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center mb-8" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          {mode === 'host' ? (
            <span className="text-cyan-400">HOSTING GAME</span>
          ) : (
            <span className="text-pink-400">JOINED GAME</span>
          )}
        </h2>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
          {/* Room Code */}
          <div>
            <label className="text-white/60 text-sm mb-2 block">Room Code</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-2xl text-center tracking-[0.3em] text-white font-mono">
                {roomCode}
              </div>
              {mode === 'host' && (
                <button
                  onClick={copyRoomCode}
                  className="p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  {copied ? <Check className="w-6 h-6 text-green-400" /> : <Copy className="w-6 h-6 text-white" />}
                </button>
              )}
            </div>
          </div>

          {/* Players */}
          <div>
            <label className="text-white/60 text-sm mb-3 block">Players</label>
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{playerName}</div>
                  <div className="text-cyan-400 text-xs">{mode === 'host' ? 'Host' : 'Guest'}</div>
                </div>
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              </div>

              <div className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 transition-all",
                player2Name 
                  ? "bg-pink-500/10 border border-pink-500/30" 
                  : "bg-white/5 border border-white/10"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  player2Name ? "bg-pink-500/30" : "bg-white/10"
                )}>
                  <Users className={cn("w-5 h-5", player2Name ? "text-pink-400" : "text-white/40")} />
                </div>
                <div className="flex-1">
                  {player2Name ? (
                    <>
                      <div className="text-white font-medium">{player2Name}</div>
                      <div className="text-pink-400 text-xs">{mode === 'host' ? 'Guest' : 'Host'}</div>
                    </>
                  ) : (
                    <div className="text-white/40">Waiting for player...</div>
                  )}
                </div>
                {player2Name ? (
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                ) : (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                )}
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 text-sm">
            {connected ? (
              <>
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-red-400">Disconnected</span>
              </>
            )}
          </div>

          {/* Start Button */}
          {mode === 'host' && (
            <button
              onClick={startGame}
              disabled={!player2Name}
              className={cn(
                "w-full py-4 rounded-lg font-bold text-lg",
                "bg-gradient-to-r from-cyan-600 to-blue-600 text-white",
                "transition-all duration-300 hover:scale-[1.02]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {player2Name ? 'Start Game' : 'Waiting for Player 2...'}
            </button>
          )}

          {mode === 'join' && (
            <div className="text-center text-white/60 py-4">
              Waiting for host to start the game...
            </div>
          )}
        </div>

        {mode === 'host' && !player2Name && (
          <p className="text-center text-white/40 text-sm mt-4">
            Share the room code with a friend to play together!
          </p>
        )}
      </div>
    </div>
  );
}
