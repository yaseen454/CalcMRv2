import React, { useState } from 'react';
import { Copy, Check, X, ShieldAlert, ExternalLink } from 'lucide-react';
import { m, AnimatePresence } from 'motion/react';

interface EscapeHatchModalProps {
  onClose: () => void;
}

export function EscapeHatchModal({ onClose }: EscapeHatchModalProps) {
  const [copied, setCopied] = useState(false);
  const siteUrl = window.location.href;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = siteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (e) {
        console.error('Failed to copy', e);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      {/* Background click to dismiss */}
      <div className="absolute inset-0 cursor-default" onClick={onClose}></div>

      {/* Modal Container */}
      <m.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="w-full max-w-md bg-[#05090d] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-5 text-left"
      >
        {/* Top gold line accent matching high-end game asset UI design */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-warframe-gold via-warframe-gold/60 to-transparent"></div>

        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 text-warframe-gold">
            <div className="p-2 rounded-lg bg-warframe-gold/10 border border-warframe-gold/20">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-display font-semibold uppercase tracking-wider text-white">
                In-App Sandbox Detected
              </h3>
              <p className="text-[10px] text-warframe-gold font-mono uppercase tracking-widest">
                Google Security Policy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
            title="Dismiss Alert"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Notice Body */}
        <div className="space-y-3">
          <p className="text-gray-300 text-xs leading-relaxed">
            Google strictly prevents authentication requests inside mobile in-app browsers 
            (such as <span className="text-white font-semibold">Instagram, Discord, Facebook Messenger, Slack, Reddit, or Telegram</span>) 
            to protect accounts from web-view interception.
          </p>
          <div className="p-3 bg-[#0c1218] border border-white/5 rounded-lg text-xs text-gray-400 leading-relaxed font-sans space-y-1">
            <span className="text-warframe-blue font-semibold block">How to access Google Sign-in:</span>
            <span>You must open this page in a native mobile browser such as <span className="text-white">Safari</span> on iOS or <span className="text-white">Chrome</span> on Android.</span>
          </div>
        </div>

        {/* Dynamic Clipboard Link Copy Panel */}
        <div className="space-y-2 pt-1">
          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">
            Application Address
          </label>
          <div className="flex items-center space-x-2 bg-[#080d12] border border-white/15 px-3 py-2.5 rounded-xl">
            <span className="text-xs font-mono text-gray-400 select-all truncate flex-1">
              {siteUrl}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 text-gray-400 hover:text-white active:scale-95 transition-all cursor-pointer"
              title="Copy link"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* CTA Actions */}
        <div className="flex flex-col gap-2 pt-2">
          {/* Beautiful high-contrast Copy Link button */}
          <button
            onClick={handleCopy}
            className="w-full bg-warframe-blue hover:brightness-110 text-black font-extrabold text-xs py-3.5 rounded-xl transition-all font-display uppercase tracking-widest text-center cursor-pointer shadow-lg active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Application Link</span>
              </>
            )}
          </button>

          {/* Secondary Dismiss Button */}
          <button
            onClick={onClose}
            className="w-full bg-[#0c1218] hover:bg-white/5 border border-white/10 text-gray-400 hover:text-white text-xs font-display uppercase tracking-widest py-3 rounded-xl transition-colors cursor-pointer text-center"
          >
            Continue Offline as Guest
          </button>
        </div>
      </m.div>
    </div>
  );
}
