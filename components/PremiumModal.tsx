
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Star, Zap, Upload, Check, X, Key, Loader2 } from 'lucide-react';
import { translations, Language } from '../utils/translations';
import { ChatSocket } from '../services/ChatSocket';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  lang: Language;
  socket: ChatSocket | null;
  userId: string;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onSubscribe, lang, socket, userId }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const t = translations[lang];

  useEffect(() => {
      if (!socket) return;
      
      const handlePromoResult = (data: { success: boolean, message: string }) => {
          setIsLoading(false);
          if (data.success) {
              setIsSubscribed(true);
              setError('');
              setTimeout(() => {
                  onSubscribe();
              }, 1500);
          } else {
              setError(data.message);
          }
      };

      const unsubscribe = socket.subscribe((data: any) => {
          if (data.type === 'PROMO_RESULT') {
              handlePromoResult(data);
          }
      });

      return () => {
          unsubscribe();
      };
  }, [socket]);

  if (!isOpen) return null;

  const handleBuy = () => {
    if (!secretKey.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    if (socket && socket.isConnected()) {
        console.log('Requesting promo redemption...');
        socket.redeemPromo(userId, secretKey);
        
        // Safety timeout
        setTimeout(() => {
            setIsLoading(prev => {
                if (prev) {
                    setError('Request timed out. Please try again.');
                    return false;
                }
                return prev;
            });
        }, 8000);
    } else {
        console.error('Socket not connected');
        setError('Connection error: You are offline');
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300 font-sans">
      <div className="bg-[#1c1c1e] text-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-ios-slide-up relative border border-white/10">
        
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
        >
            <X size={20} />
        </button>

        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 h-40 flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
             <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
                <Star size={64} fill="white" className="drop-shadow-lg mb-2" />
                <h1 className="text-2xl font-black tracking-wide uppercase drop-shadow-md">RedGram Premium</h1>
             </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
           <p className="text-center text-gray-300 text-sm font-medium">{t.premiumDesc}</p>
           
           <div className="space-y-4">
               <FeatureRow icon={<Star size={20} className="text-purple-400" />} title={t.featureStar} desc={t.featureStarDesc} />
               <FeatureRow icon={<Zap size={20} className="text-yellow-400" />} title={t.featureSpeed} desc={t.featureSpeedDesc} />
               <FeatureRow icon={<Upload size={20} className="text-blue-400" />} title={t.featureUpload} desc={t.featureUploadDesc} />
           </div>

           <div className="mt-2">
               <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <Key size={18} className="text-gray-400" />
                   </div>
                   <input
                       type="text"
                       placeholder="Enter Secret Key"
                       value={secretKey}
                       onChange={(e) => {
                           setSecretKey(e.target.value);
                           setError('');
                       }}
                       className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                   />
               </div>
               {error && <p className="text-red-400 text-xs mt-2 ml-1">{error}</p>}
           </div>

           <button 
             onClick={handleBuy}
             disabled={isSubscribed || !secretKey || isLoading}
             className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all mt-2 relative overflow-hidden
                ${isSubscribed ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-purple-500/40 active:scale-95 text-white disabled:opacity-50 disabled:cursor-not-allowed'}
             `}
           >
             {isLoading ? (
                 <Loader2 size={24} className="animate-spin" />
             ) : isSubscribed ? (
                 <>
                    <Check size={24} /> {t.premiumActivated}
                 </>
             ) : (
                 t.premiumButton
             )}
             {!isSubscribed && !isLoading && <div className="absolute inset-0 bg-white/20 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>}
           </button>
        </div>

      </div>
    </div>
  );
};

const FeatureRow: React.FC<{icon: React.ReactNode, title: string, desc: string}> = ({icon, title, desc}) => (
    <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            {icon}
        </div>
        <div>
            <div className="font-bold text-white text-[15px]">{title}</div>
            <div className="text-xs text-gray-400">{desc}</div>
        </div>
    </div>
)
