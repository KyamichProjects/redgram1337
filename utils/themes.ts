
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ThemeKey = 'red' | 'blue' | 'black' | 'brown' | 'glass';

export interface Theme {
    id: ThemeKey;
    name: string;
    gradient: string; // Header background
    primary: string; // Main buttons, accents
    secondary: string; // Lighter accents
    textHighlight: string; // Active text color
    bubbleSent: string; // User message bubble gradient
    buttonGradient: string; // Send button
    ring: string; // Focus rings
    iconColor: string; // Icons in profile
}

export const THEMES: Record<ThemeKey, Theme> = {
    red: {
        id: 'red',
        name: 'RedGram (Classic)',
        gradient: 'bg-gradient-to-r from-red-600 via-red-500 to-rose-500',
        primary: 'bg-red-500',
        secondary: 'bg-red-50',
        textHighlight: 'text-red-500',
        bubbleSent: 'bg-gradient-to-br from-red-500 to-rose-600',
        buttonGradient: 'bg-gradient-to-br from-red-500 to-rose-600',
        ring: 'focus:ring-red-500',
        iconColor: 'text-red-500'
    },
    blue: {
        id: 'blue',
        name: 'Ocean Blue',
        gradient: 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500',
        primary: 'bg-blue-500',
        secondary: 'bg-blue-50',
        textHighlight: 'text-blue-500',
        bubbleSent: 'bg-gradient-to-br from-blue-500 to-cyan-600',
        buttonGradient: 'bg-gradient-to-br from-blue-500 to-cyan-600',
        ring: 'focus:ring-blue-500',
        iconColor: 'text-blue-500'
    },
    black: {
        id: 'black',
        name: 'Midnight',
        gradient: 'bg-gradient-to-r from-gray-900 via-gray-800 to-slate-800',
        primary: 'bg-gray-800',
        secondary: 'bg-gray-100',
        textHighlight: 'text-gray-900',
        bubbleSent: 'bg-gradient-to-br from-gray-800 to-gray-900',
        buttonGradient: 'bg-gradient-to-br from-gray-800 to-gray-900',
        ring: 'focus:ring-gray-500',
        iconColor: 'text-gray-800'
    },
    brown: {
        id: 'brown',
        name: 'Coffee',
        gradient: 'bg-gradient-to-r from-amber-700 via-orange-800 to-yellow-900',
        primary: 'bg-amber-700',
        secondary: 'bg-amber-50',
        textHighlight: 'text-amber-700',
        bubbleSent: 'bg-gradient-to-br from-amber-600 to-orange-700',
        buttonGradient: 'bg-gradient-to-br from-amber-600 to-orange-700',
        ring: 'focus:ring-amber-700',
        iconColor: 'text-amber-700'
    },
    glass: {
        id: 'glass',
        name: 'Liquid Glass',
        gradient: 'bg-gradient-to-r from-slate-300 via-gray-200 to-zinc-300 backdrop-blur-xl border-b border-white/20',
        primary: 'bg-slate-700',
        secondary: 'bg-white/60',
        textHighlight: 'text-slate-800',
        bubbleSent: 'bg-gradient-to-br from-slate-600 to-slate-800',
        buttonGradient: 'bg-gradient-to-br from-slate-700 to-slate-900',
        ring: 'focus:ring-slate-400',
        iconColor: 'text-slate-700'
    }
};
