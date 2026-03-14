import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { UserProfile } from '../services/ChatSocket';

interface CallInterfaceProps {
    callState: 'incoming' | 'outgoing' | 'connected' | 'idle';
    caller: UserProfile | null;
    onAnswer: () => void;
    onReject: () => void;
    onEnd: () => void;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isVideo: boolean;
}

export const CallInterface: React.FC<CallInterfaceProps> = ({
    callState, caller, onAnswer, onReject, onEnd, localStream, remoteStream, isVideo
}) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(!isVideo);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    useEffect(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
    }, [isMuted, localStream]);

    useEffect(() => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !isCameraOff;
            });
        }
    }, [isCameraOff, localStream]);

    if (callState === 'idle') return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center text-white">
            {/* Remote Audio/Video */}
            {callState === 'connected' && (
                <div className={`absolute inset-0 w-full h-full ${!isVideo ? 'hidden' : ''}`}>
                    <video 
                        ref={remoteVideoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Local Video (PIP) */}
            {callState === 'connected' && isVideo && (
                <div className="absolute top-4 right-4 w-32 h-48 bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-white/20">
                    <video 
                        ref={localVideoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Caller Info (Overlay) */}
            <div className="z-10 flex flex-col items-center mt-20">
                <div className={`w-32 h-32 rounded-full ${caller?.avatarColor || 'bg-gray-500'} flex items-center justify-center text-4xl font-bold shadow-2xl mb-6 overflow-hidden border-4 border-white/10`}>
                    {caller?.avatar ? (
                        <img src={caller.avatar} className="w-full h-full object-cover" />
                    ) : (
                        caller?.name?.substring(0, 1).toUpperCase()
                    )}
                </div>
                <h2 className="text-3xl font-bold mb-2 drop-shadow-md">{caller?.name}</h2>
                <p className="text-lg opacity-80 animate-pulse">
                    {callState === 'incoming' ? 'Incoming Call...' : 
                     callState === 'outgoing' ? 'Calling...' : 
                     'Connected'}
                </p>
            </div>

            {/* Controls */}
            <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-8 z-20">
                {callState === 'incoming' ? (
                    <>
                        <button onClick={onReject} className="p-4 bg-red-500 rounded-full hover:bg-red-600 transition-all shadow-lg animate-bounce">
                            <PhoneOff size={32} />
                        </button>
                        <button onClick={onAnswer} className="p-4 bg-green-500 rounded-full hover:bg-green-600 transition-all shadow-lg animate-bounce [animation-delay:0.2s]">
                            <Phone size={32} />
                        </button>
                    </>
                ) : (
                    <>
                        {callState === 'connected' && (
                            <>
                                <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-full transition-all ${isMuted ? 'bg-white text-black' : 'bg-white/20 hover:bg-white/30'}`}>
                                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                                </button>
                                {isVideo && (
                                    <button onClick={() => setIsCameraOff(!isCameraOff)} className={`p-4 rounded-full transition-all ${isCameraOff ? 'bg-white text-black' : 'bg-white/20 hover:bg-white/30'}`}>
                                        {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
                                    </button>
                                )}
                            </>
                        )}
                        <button onClick={onEnd} className="p-4 bg-red-500 rounded-full hover:bg-red-600 transition-all shadow-lg">
                            <PhoneOff size={32} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
