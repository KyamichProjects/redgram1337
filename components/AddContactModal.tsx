
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Check } from 'lucide-react';
import { translations, Language } from '../utils/translations';
import { Theme } from '../utils/themes';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (firstName: string, lastName: string, phone: string) => void;
  lang: Language;
  theme: Theme;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({ isOpen, onClose, onAdd, lang, theme }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+');
  const t = translations[lang];

  if (!isOpen) return null;

  const handleSave = () => {
    if (firstName.trim() && phone.trim().length > 1) {
      onAdd(firstName.trim(), lastName.trim(), phone.trim());
      // Reset
      setFirstName('');
      setLastName('');
      setPhone('+');
      onClose();
    }
  };

  const isFormValid = firstName.trim().length > 0 && phone.trim().length > 2;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-[#f2f2f7] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-ios-slide-up">
        
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-gray-200 sticky top-0 z-10">
          <button 
            onClick={onClose} 
            className={`font-medium text-[17px] hover:opacity-70 transition-opacity ${theme.textHighlight}`}
          >
            {t.cancel}
          </button>
          <h2 className="text-[17px] font-bold text-gray-900">{t.newContact}</h2>
          <button 
            onClick={handleSave}
            disabled={!isFormValid}
            className={`font-bold text-[17px] transition-opacity ${!isFormValid ? 'text-gray-300' : 'text-blue-500 hover:opacity-70'} flex items-center`}
          >
            <Check size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
           
           <div className="flex justify-center">
               <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg ring-4 ring-white">
                    <User size={40} />
               </div>
           </div>

           <div className="w-full space-y-4">
              {/* Name Fields */}
              <div className="bg-white rounded-xl overflow-hidden border border-gray-200/60 shadow-sm">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <input 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder={t.firstName}
                        className="w-full text-[17px] py-2 outline-none bg-transparent placeholder-gray-400"
                        autoFocus
                    />
                  </div>
                  <div className="px-4 py-2">
                    <input 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder={t.lastName}
                        className="w-full text-[17px] py-2 outline-none bg-transparent placeholder-gray-400"
                    />
                  </div>
              </div>

              {/* Phone Field */}
              <div className="bg-white rounded-xl overflow-hidden border border-gray-200/60 shadow-sm px-4 py-2 flex flex-col">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Mobile</span>
                  <div className="flex items-center gap-2">
                      <span className="text-[17px] font-medium text-gray-900"></span>
                      <input 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="w-full text-[17px] py-2 outline-none bg-transparent placeholder-gray-400 font-medium tracking-wide"
                        type="tel"
                      />
                  </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
