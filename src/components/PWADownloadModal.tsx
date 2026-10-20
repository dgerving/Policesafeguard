import React, { useState } from 'react';
import { 
  Download, Smartphone, Apple, Monitor, QrCode, Copy, Check, 
  X, ExternalLink, ShieldCheck, WifiOff, Share2, Sparkles, 
  DollarSign, Landmark, CheckCircle2, MessageSquare, Send, 
  HelpCircle, ArrowRight, Zap, Globe
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppUrlHelper } from '../services/appUrlHelper';

interface PWADownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
  referralCode?: string;
  citizenName?: string;
  initialTab?: 'publish_free' | 'install_device' | 'cost_breakdown';
  onOpenOfficialDomainModal?: () => void;
}

export const PWADownloadModal: React.FC<PWADownloadModalProps> = ({
  isOpen,
  onClose,
  appUrl,
  referralCode,
  citizenName,
  initialTab = 'publish_free',
  onOpenOfficialDomainModal
}) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<'install_device' | 'share_link'>('install_device');
  const [activePlatformTab, setActivePlatformTab] = useState<'ios' | 'android' | 'desktop'>('ios');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = AppUrlHelper.getLiveAccountDownloadUrl(referralCode, citizenName);
  const trustMessage = AppUrlHelper.getTrustworthyShareMessage(referralCode, citizenName);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Police SafeGuard: Personal AI Rights & Encounter Guide',
          text: 'Protect your constitutional rights during police traffic stops, home visits, and street encounters with real-time AI guidance.',
          url: currentUrl,
        });
        setShareFeedback('Shared successfully!');
        setTimeout(() => setShareFeedback(null), 3000);
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const res = await install();
      if (res) {
        setShareFeedback('✅ App installed successfully to your device!');
      }
    }
  };

  const handleOneClickDownloadApp = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setShareFeedback('✅ Police SafeGuard installed to your home screen!');
        return;
      }
    }

    if (isIOS) {
      setActiveTab('install_device');
      setActivePlatformTab('ios');
      setShareFeedback('📱 On iOS Safari: Tap Share [⎋] below, then tap "Add to Home Screen"');
    } else {
      setActiveTab('install_device');
      setActivePlatformTab('android');
      setShareFeedback('📱 On Android Chrome: Tap browser menu (⋮) -> "Install app" or "Add to Home screen"');
    }
  };

  // SVG QR Code pointing to the current live app URL
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}&bgcolor=09090b&color=fbbf24`;

  return (
    <div id="pwa-download-modal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-2xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 relative bg-gradient-to-b from-zinc-850 to-zinc-900 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-amber-400 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>OFFICIAL CIVILIAN APP DISTRIBUTION</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
            Police SafeGuard: App Download &amp; Distribution
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            Access and install <strong>Police SafeGuard</strong> across iOS, Android, tablet, and desktop with real-time offline protection.
          </p>

          {/* Navigation Tabs */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('share_link')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'share_link'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share &amp; Launch Link</span>
            </button>

            <button
              onClick={() => setActiveTab('install_device')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'install_device'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install on Device (PWA)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">

          {/* ONE BUTTON CLICK TO DOWNLOAD MOBILE APP HERO BANNER */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/25 via-zinc-900 to-emerald-950/60 border-2 border-amber-500/70 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/30 shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                    One-Click Mobile App Download
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase">
                    100% Free
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Instant offline protection on iOS, Android, and tablets with edge dashcam recording.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOneClickDownloadApp}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/30 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 fill-black" />
              <span>Download Mobile App (1-Click)</span>
            </button>
          </div>

          {shareFeedback && (
            <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{shareFeedback}</span>
            </div>
          )}

          {/* TAB 1: SHARE & LAUNCH */}
          {activeTab === 'share_link' && (
            <div className="space-y-5">
              
              {/* Live Public URL Card */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Official Live Download Link
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-zinc-300">
                  Share this link with anyone to download and open Police SafeGuard directly on their mobile device or desktop:
                </p>

                {/* URL Bar & Copy / Share Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-xl p-2">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="bg-transparent text-xs text-amber-300 font-mono px-2 py-1 flex-1 focus:outline-none truncate select-all"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-black" />
                          <span>Copied Link!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-black" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleNativeShare}
                      className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </div>
                </div>

                {shareFeedback && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{shareFeedback}</span>
                  </div>
                )}
              </div>

              {/* QR Code Card for Instant Phone Scanning & Physical Marketing */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
                <div className="shrink-0 p-2.5 bg-zinc-900 border border-amber-500/40 rounded-2xl flex flex-col items-center shadow-lg">
                  <img 
                    src={qrSvgUrl} 
                    alt="Scan QR Code to install Police SafeGuard" 
                    className="w-32 h-32 rounded-lg"
                  />
                  <span className="text-[10px] text-amber-400 font-mono mt-2 font-bold flex items-center gap-1">
                    <QrCode className="w-3 h-3" />
                    <span>SCAN TO OPEN / INSTALL</span>
                  </span>
                </div>

                <div className="flex-1 space-y-2.5 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Zero-Cost Viral Distribution (Flyers &amp; Socials)</span>
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Print this QR code on cards, vehicle window stickers, posters, or post it on TikTok, Instagram, and X (Twitter). When someone points their phone camera at it, <strong>Police SafeGuard</strong> opens immediately without passing through the Apple App Store or Google Play.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <a
                      href={`sms:?&body=Protect%20your%20rights%20during%20police%20encounters%20with%20Police%20Protection:%20${encodeURIComponent(currentUrl)}`}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Text to Friend</span>
                    </a>
                    <a
                      href={`mailto:?subject=Police%20Protection%20App&body=Check%20out%20Police%20Protection%20AI%20Rights%20Guide:%20${encodeURIComponent(currentUrl)}`}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Email Link</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* 4-Step $0 Launch Blueprint */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>How You Publish &amp; Make Money With Zero Upfront Dollars</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                    <span className="font-bold text-white block mb-1 text-[13px]">1. Share Your Public Link ($0)</span>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Post your link on social media, share with friends, or hand out the QR code. You pay $0 for hosting and $0 for distribution.
                    </p>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                    <span className="font-bold text-white block mb-1 text-[13px]">2. No App Store Fees ($0)</span>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      You bypass Apple's $99/year developer fee and Google's $25 fee. The Progressive Web App installs straight from the browser onto iPhone and Android.
                    </p>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                    <span className="font-bold text-white block mb-1 text-[13px]">3. Free Stripe Account ($0)</span>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Setting up Stripe to take credit cards costs $0. There are zero monthly charges. Stripe only takes a standard ~2.9% + 30¢ fee <em>after</em> a customer pays you.
                    </p>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                    <span className="font-bold text-white block mb-1 text-[13px]">4. Direct Bank Deposits ($0)</span>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Every time someone buys a monthly, annual, lifetime pass, or credit pack, the net profits automatically transfer into your bank account.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: INSTALL ON DEVICE */}
          {activeTab === 'install_device' && (
            <div className="space-y-5">
              
              {/* Quick Install Action Banner */}
              {isInstallable && (
                <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center shrink-0 shadow-md">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Browser Ready to Install</h4>
                      <p className="text-xs text-zinc-300">Add Police SafeGuard directly to your home screen or dock.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer whitespace-nowrap"
                  >
                    Install App Now
                  </button>
                </div>
              )}

              {isInstalled && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="text-xs text-emerald-300 font-medium">
                    Police SafeGuard is already installed and running in standalone mode!
                  </div>
                </div>
              )}

              {/* Platform Selector */}
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Installation Guides by Platform
                </h4>
                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                  <button
                    onClick={() => setActivePlatformTab('ios')}
                    className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                      activePlatformTab === 'ios' ? 'bg-zinc-800 text-amber-400 font-bold' : 'text-zinc-400'
                    }`}
                  >
                    <Apple className="w-3.5 h-3.5" />
                    <span>iOS Safari</span>
                  </button>
                  <button
                    onClick={() => setActivePlatformTab('android')}
                    className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                      activePlatformTab === 'android' ? 'bg-zinc-800 text-amber-400 font-bold' : 'text-zinc-400'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Android</span>
                  </button>
                  <button
                    onClick={() => setActivePlatformTab('desktop')}
                    className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                      activePlatformTab === 'desktop' ? 'bg-zinc-800 text-amber-400 font-bold' : 'text-zinc-400'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop</span>
                  </button>
                </div>
              </div>

              {/* iOS Guide */}
              {activePlatformTab === 'ios' && (
                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 text-xs space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-zinc-300">
                      Open this link in <strong>Apple Safari</strong> on your iPhone or iPad.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-zinc-300">
                      Tap the <strong>Share</strong> button (the box with an upward arrow) in Safari's bottom toolbar.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="text-zinc-300">
                      Scroll down and tap <strong>"Add to Home Screen"</strong>, then tap <strong>Add</strong> in the top right.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      4
                    </span>
                    <p className="text-zinc-300">
                      <strong>Police SafeGuard</strong> is now installed as a standalone full-screen native app icon!
                    </p>
                  </div>
                </div>
              )}

              {/* Android Guide */}
              {activePlatformTab === 'android' && (
                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 text-xs space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-zinc-300">
                      Open this link in <strong>Google Chrome</strong> or Samsung Internet on Android.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-zinc-300">
                      Tap the banner <strong>"Add to Home screen"</strong> or tap the three dots (<strong className="font-mono">⋮</strong>) menu.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="text-zinc-300">
                      Select <strong>Install app</strong>. The app installs directly into your Android app drawer.
                    </p>
                  </div>
                </div>
              )}

              {/* Desktop Guide */}
              {activePlatformTab === 'desktop' && (
                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 text-xs space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-zinc-300">
                      In Chrome, Edge, or Brave, click the <strong>Install</strong> icon in the address bar (on the right).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-zinc-300">
                      Click <strong>Install Police SafeGuard</strong> to run it in a clean window with zero browser tabs.
                    </p>
                  </div>
                </div>
              )}

              {/* Offline Capabilities Card */}
              <div className="bg-zinc-800/40 border border-zinc-700/60 rounded-xl p-3.5 flex items-center gap-3">
                <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-xs text-zinc-300">
                  <span className="font-semibold text-white">Full Offline Operation: </span>
                  The installed PWA caches all state legal statutes, encounter guides, and recording capabilities locally, so users stay protected even when cellular data drops.
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>PWA Certified • Zero Upfront Cost • Direct Bank Settlement</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
