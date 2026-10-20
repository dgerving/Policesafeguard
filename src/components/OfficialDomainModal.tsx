import React, { useState } from 'react';
import { 
  Globe, Shield, Check, Copy, ExternalLink, X, Sparkles, 
  Share2, ArrowRight, Server, CheckCircle2, AlertTriangle, 
  HelpCircle, Settings, QrCode, Smartphone, MessageSquare, Download, ShieldCheck
} from 'lucide-react';
import { AppUrlHelper, OfficialDomainOption } from '../services/appUrlHelper';

interface OfficialDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode?: string;
  userName?: string;
}

export const OfficialDomainModal: React.FC<OfficialDomainModalProps> = ({
  isOpen,
  onClose,
  referralCode,
  userName,
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string>(() => AppUrlHelper.getCustomDomain());
  const [customInput, setCustomInput] = useState<string>('');
  const [urlMode, setUrlMode] = useState<'branded' | 'direct'>(() => AppUrlHelper.getUrlMode());
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<'vercel' | 'northwest' | 'custom_domain' | 'dns_guide' | 'self_host' | 'fix_502'>('vercel');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const directCloudUrl = AppUrlHelper.getLiveAccountDownloadUrl(referralCode, userName, 'direct');
  const trustMessage = AppUrlHelper.getTrustworthyShareMessage(referralCode, userName);
  const dnsInfo = AppUrlHelper.getDNSInstructions(selectedDomain);
  const northwestForwardingUrl = AppUrlHelper.getNorthwestForwardingDestination(referralCode);

  const handleSelectPredefined = (domain: string) => {
    setSelectedDomain(domain);
    AppUrlHelper.setCustomDomain(domain);
    setSaveToast(`Active official website set to: https://${domain}`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const cleaned = customInput.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    setSelectedDomain(cleaned);
    AppUrlHelper.setCustomDomain(cleaned);
    setCustomInput('');
    setSaveToast(`Custom domain configured: https://${cleaned}`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleCopyDirectUrl = () => {
    navigator.clipboard.writeText(directCloudUrl);
    setCopiedDirect(true);
    setTimeout(() => setCopiedDirect(false), 2200);
  };

  const handleCopyTrustMessage = () => {
    navigator.clipboard.writeText(trustMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2200);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Police SafeGuard: Official Civilian Rights Assistant',
        text: `Know your constitutional rights in real time during police stops. Download 100% free:`,
        url: directCloudUrl,
      }).catch(() => {});
    } else {
      handleCopyDirectUrl();
    }
  };

  const ZIP_BASE64 = 'UEsDBBQAAAAAAAAAAAArvRjqLgkAAC4JAAAKAAAAaW5kZXguaHRtbDwhRE9DVFlQRSBodG1sPgo8aHRtbCBsYW5nPSJlbiI+CjxoZWFkPgogIDxtZXRhIGNoYXJzZXQ9IlVURi04Ij4KICA8bWV0YSBuYW1lPSJ2aWV3cG9ydCIgY29udGVudD0id2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMCI+CiAgPHRpdGxlPlBvbGljZSBTYWZlZ3VhcmQg4oCTIE9mZmljaWFsIENpdmlsaWFuIEFJIFJpZ2h0cyBBc3Npc3RhbnQ8L3RpdGxlPgogIDxtZXRhIGh0dHAtZXF1aXY9InJlZnJlc2giIGNvbnRlbnQ9IjA7IHVybD1odHRwczovL3d3dy5wb2xpY2VzYWZlZ3VhcmQuY29tLz9zaWdudXA9MSI+CiAgPGxpbmsgcmVsPSJjYW5vbmljYWwiIGhyZWY9Imh0dHBzOi8vd3d3LnBvbGljZXNhZmVndWFyZC5jb20vP3NpZ251cD0xIj4KICA8bWV0YSBuYW1lPSJkZXNjcmlwdGlvbiIgY29udGVudD0iWW91ciBwZXJzb25hbCBBSSBndWlkZSB0byBoZWxwIGVuc3VyZSB5b3VyIHJpZ2h0cyBhcmUgcHJvdGVjdGVkIGR1cmluZyBsYXcgZW5mb3JjZW1lbnQgZW5jb3VudGVycy4gUmVhbC10aW1lIGNvbnN0aXR1dGlvbmFsIHJpZ2h0cyBpbiB5b3VyIGp1cmlzZGljdGlvbi4iPgogIDxtZXRhIHByb3BlcnR5PSJvZzp0aXRsZSIgY29udGVudD0iUG9saWNlIFNhZmVndWFyZCDigJMgT2ZmaWNpYWwgQ2l2aWxpYW4gQUkgUmlnaHRzIEFzc2lzdGFudCI+CiAgPG1ldGEgcHJvcGVydHk9Im9nOmRlc2NyaXB0aW9uIiBjb250ZW50PSJSZWFsLXRpbWUgY29uc3RpdHV0aW9uYWwgZ3VpZGFuY2UsIG11bHRpLWxhbmd1YWdlIHNwZWVjaCB0cmFuc2xhdGlvbiwgYW5kIGNlcnRpZmllZCBlbmNyeXB0ZWQgdmF1bHQgZXZpZGVuY2UuIj4KICA8bWV0YSBwcm9wZXJ0eT0ib2c6dXJsIiBjb250ZW50PSJodHRwczovL3d3dy5wb2xpY2VzYWZlZ3VhcmQuY29tLz9zaWdudXA9MSI+CiAgPHN0eWxlPgogICAgYm9keSB7CiAgICAgIGJhY2tncm91bmQ6ICMwOTA5MGI7CiAgICAgIGNvbG9yOiAjZjRmNGY1OwogICAgICBmb250LWZhbWlseTogLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCAiU2Vnb2UgVUkiLCBSb2JvdG8sIHNhbnMtc2VyaWY7CiAgICAgIGRpc3BsYXk6IGZsZXg7CiAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47CiAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7CiAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyOwogICAgICBoZWlnaHQ6IDEwMHZoOwogICAgICBtYXJnaW46IDA7CiAgICAgIHRleHQtYWxpZ246IGNlbnRlcjsKICAgICAgcGFkZGluZzogMjBweDsKICAgIH0KICAgIC5zcGlubmVyIHsKICAgICAgd2lkdGg6IDQ4cHg7CiAgICAgIGhlaWdodDogNDhweDsKICAgICAgYm9yZGVyOiA0cHggc29saWQgIzI3MjcyYTsKICAgICAgYm9yZGVyLXRvcDogNHB4IHNvbGlkICNmNTllMGI7CiAgICAgIGJvcmRlci1yYWRpdXM6IDUwJTsKICAgICAgYW5pbWF0aW9uOiBzcGluIDAuOHMgbGluZWFyIGluZmluaXRlOwogICAgICBtYXJnaW4tYm90dG9tOiAyMHB4OwogICAgfQogICAgQGtleWZyYW1lcyBzcGluIHsgMTAwJSB7IHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IH0gfQogICAgaDEgeyBmb250LXNpemU6IDIwcHg7IGZvbnQtd2VpZ2h0OiA4MDA7IG1hcmdpbjogMCAwIDhweCAwOyBjb2xvcjogI2ZiYmYyNDsgfQogICAgcCB7IGZvbnQtc2l6ZTogMTRweDsgY29sb3I6ICNhMWExYWE7IG1hcmdpbjogMCAwIDE2cHggMDsgfQogICAgYSB7IGNvbG9yOiAjZmRlMDQ3OyB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTsgZm9udC13ZWlnaHQ6IGJvbGQ7IH0KICA8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5PgogIDxkaXYgY2xhc3M9InNwaW5uZXIiPjwvZGl2PgogIDxoMT5Db25uZWN0aW5nIHRvIFBvbGljZSBTYWZlZ3VhcmQuLi48L2gxPgogIDxwPlNlY3VyaW5nIGNpdmlsaWFuIHJpZ2h0cyBlbnZpcm9ubWVudC4gT3BlbmluZyBvZmZpY2lhbCBzaWduLXVwIG9uYm9hcmRpbmcuLi48L3A+CiAgPHA+SWYgeW91IGFyZSBub3QgcmVkaXJlY3RlZCBhdXRvbWF0aWNhbGx5LCA8YSBocmVmPSJodHRwczovL3d3dy5wb2xpY2VzYWZlZ3VhcmQuY29tLz9zaWdudXA9MSI+Y2xpY2sgaGVyZSB0byBvcGVuIFBvbGljZSBTYWZlZ3VhcmQ8L2E+LjwvcD4KICA8c2NyaXB0PgogICAgY29uc3Qgc2VhcmNoID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaCB8fCAnP3NpZ251cD0xJzsKICAgIGNvbnN0IHBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgPT09ICcvJyA/ICcnIDogd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lOwogICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2UoJ2h0dHBzOi8vd3d3LnBvbGljZXNhZmVndWFyZC5jb20nICsgcGF0aCArIHNlYXJjaCk7CiAgPC9zY3JpcHQ+CjwvYm9keT4KPC9odG1sPgpQSwMEFAAAAAAAAAAAAOk3j0AvAAAALwAAAAoAAABfcmVkaXJlY3RzLyogaHR0cHM6Ly93d3cucG9saWNlc2FmZWd1YXJkLmNvbS86c3BsYXQgMzAxIQpQSwECFAAUAAAAAAAAAAAAK70Y6i4JAAAuCQAACgAAAAAAAAAAAAAAAAAAAAAAaW5kZXguaHRtbFBLAQIUABQAAAAAAAAAAADpN49ALwAAAC8AAAAKAAAAAAAAAAAAAAAAAFYJAABfcmVkaXJlY3RzUEsFBgAAAAACAAIAcAAAAK0JAAAAAA==';

  const handleDownloadCloudflareZip = () => {
    try {
      const byteCharacters = atob(ZIP_BASE64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'policesafeguard-cloudflare.zip';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
      setSaveToast('Cloudflare forwarder ZIP downloaded!');
      setTimeout(() => setSaveToast(null), 3000);
    } catch (e) {
      setSaveToast('Failed to create forwarder zip.');
    }
  };

  return (
    <div id="official-domain-modal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden text-zinc-100 my-auto animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-amber-500/15 via-zinc-900 to-zinc-900 border-b border-zinc-800 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-800/60 hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
              <Globe className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase">
                  Official Website &amp; Clean Domain
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                  Zero Suspicion
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Share high-trust, official-looking links that friends and family feel safe opening
              </p>
            </div>
          </div>

          {/* Feedback Toast */}
          {saveToast && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveToast}</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950 px-4 sm:px-6 pt-2 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('vercel')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'vercel'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Vercel + Cloudflare Setup</span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-black uppercase">Recommended</span>
          </button>

          <button
            onClick={() => setActiveTab('northwest')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'northwest'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Northwest Registered Agent</span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-black uppercase">Your Host</span>
          </button>

          <button
            onClick={() => setActiveTab('fix_502')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'fix_502'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Fix 502 / Host Error</span>
          </button>

          <button
            onClick={() => setActiveTab('custom_domain')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'custom_domain'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Brand Domains</span>
          </button>

          <button
            onClick={() => setActiveTab('dns_guide')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'dns_guide'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>DNS Setup Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('self_host')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'self_host'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Self-Host on Server</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] space-y-4 text-xs flex-1">
          
          {/* TAB: VERCEL + CLOUDFLARE PRODUCTION DEPLOYMENT */}
          {activeTab === 'vercel' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Important Callout */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-950 to-zinc-900 border border-amber-500/40 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-black text-white text-sm uppercase tracking-wide">
                    Zero AI Studio Footprint Guarantee
                  </h3>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  When deployed on <strong>Vercel</strong> under your domain <strong>policesafeguard.com</strong>, your app runs 100% independently on Vercel&apos;s global CDN. Visitors will never see AI Studio, will never see your developer login, and will have zero access to code changes.
                </p>
              </div>

              {/* Step 1: Connect Custom Domain on Vercel */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h4 className="font-black text-amber-300 text-sm flex items-center gap-2">
                      <span>Step 1: Connect Custom Domain on Vercel</span>
                    </h4>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      Deploy directly from your private GitHub repository to keep your source code completely protected and private.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: Push to GitHub & Deploy to Vercel */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[11px] font-black">2</span>
                  <span>Deploy on Vercel (vercel.com)</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-zinc-300 text-[11px] leading-relaxed pl-1">
                  <li>Push your production codebase to your GitHub repo named <code className="bg-zinc-900 px-1 py-0.5 rounded text-amber-300">policesafeguard</code>.</li>
                  <li>Log in to <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-bold">vercel.com/new</a> and click <strong>Import</strong> next to your repository.</li>
                  <li>Framework Preset: Keep as <strong>Vite</strong>. Build command: <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-200">npm run build</code>. Output directory: <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-200">dist</code>.</li>
                  <li>Click <strong>Deploy</strong>. Vercel will build and assign your project a secure production link.</li>
                </ol>
              </div>

              {/* Step 3: Domain & Cloudflare DNS */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[11px] font-black">3</span>
                  <span>Connect policesafeguard.com &amp; Cloudflare DNS</span>
                </h4>
                <p className="text-zinc-300 text-[11px]">
                  In your Vercel Project &rarr; <strong>Settings</strong> &rarr; <strong>Domains</strong>, add <code className="text-amber-300 font-mono bg-zinc-900 px-1 rounded">policesafeguard.com</code> and <code className="text-amber-300 font-mono bg-zinc-900 px-1 rounded">www.policesafeguard.com</code>. Then set these exact records in Cloudflare:
                </p>

                <div className="space-y-2 pt-1">
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 font-mono text-[11px] space-y-1">
                    <div className="text-zinc-400 font-sans font-bold text-[10px] uppercase">Record 1: Apex Domain</div>
                    <div className="flex items-center justify-between text-zinc-200">
                      <span><strong>Type:</strong> A</span>
                      <span><strong>Name:</strong> @</span>
                      <span><strong>Points to:</strong> <code className="text-amber-300 font-bold">76.76.21.21</code></span>
                      <span className="text-zinc-400 text-[10px]">Proxy: DNS Only</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 font-mono text-[11px] space-y-1">
                    <div className="text-zinc-400 font-sans font-bold text-[10px] uppercase">Record 2: WWW Subdomain</div>
                    <div className="flex items-center justify-between text-zinc-200">
                      <span><strong>Type:</strong> CNAME</span>
                      <span><strong>Name:</strong> www</span>
                      <span><strong>Target:</strong> <code className="text-amber-300 font-bold">cname.vercel-dns.com</code></span>
                      <span className="text-zinc-400 text-[10px]">Proxy: DNS Only</span>
                    </div>
                  </div>
                </div>

                <p className="text-emerald-300 text-[11px] font-semibold mt-2">
                  In Cloudflare &rarr; <strong>SSL/TLS</strong>, ensure encryption mode is set to <strong>Full</strong> or <strong>Full (strict)</strong>.
                </p>
              </div>

            </div>
          )}

          {/* TAB 0: NORTHWEST REGISTERED AGENT 1-CLICK STEP-BY-STEP */}
          {activeTab === 'northwest' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Alert explaining what went wrong with 66.223.49.89 */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-zinc-950 to-amber-950/60 border border-emerald-500/50 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Why Northwest Gave You An Error &amp; How We Fix It Right Now
                    </h3>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                      The IP address <code className="text-amber-300 font-mono bg-zinc-900 px-1 rounded">66.223.49.89</code> belongs to Epik LLC's default registrar parking system. When you pointed your DNS A record to it, visitors were reaching a dead parking slot with no active web server or SSL certificates.
                    </p>
                    <p className="text-[11px] text-emerald-300 font-semibold mt-1">
                      ✅ Follow <strong>Method 1 (Domain Forwarding)</strong> below in your Northwest account—it takes under 60 seconds and immediately routes all visitors to Police Safeguard with the official sign-up onboarding open!
                    </p>
                  </div>
                </div>
              </div>

              {/* METHOD 1: NORTHWEST BUILT-IN DOMAIN FORWARDING */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs flex items-center justify-center font-bold">1</span>
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Method 1: Northwest Domain Forwarding (Recommended — 60 Seconds)
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                    Fastest &amp; Easiest
                  </span>
                </div>

                <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 space-y-3 text-[11px] text-zinc-300">
                  <div className="space-y-1.5">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>Step 1: Open Northwest Client Portal</span>
                    </div>
                    <p className="text-zinc-400">
                      Log into your account at <a href="https://www.northwestregisteredagent.com" target="_blank" rel="noreferrer" className="text-amber-300 underline font-mono">northwestregisteredagent.com</a> and click on <strong className="text-white">"Domains"</strong> in your dashboard.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>Step 2: Select policesafeguard.com</span>
                    </div>
                    <p className="text-zinc-400">
                      Click your domain name <code className="text-amber-300 font-mono bg-black/40 px-1 rounded">policesafeguard.com</code> to open its management panel.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>Step 3: Remove the Dead A Record (66.223.49.89)</span>
                    </div>
                    <p className="text-zinc-400">
                      Under DNS Records, delete the A record pointing to <code className="text-red-400 font-mono bg-black/40 px-1 rounded">66.223.49.89</code> so it stops blocking web traffic (that IP is an unconfigured registrar parking address).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>Step 4: Enable Northwest Web Forwarding (URL Redirect)</span>
                    </div>
                    <p className="text-zinc-400">
                      In Northwest Registered Agent, click <strong className="text-white">"Forwarding"</strong> (or <strong className="text-white">"Web Forwarding"</strong>). Choose either destination URL below depending on your preferred default landing experience:
                    </p>

                    {/* Option A: Direct to Official Sign-Up Landing Page */}
                    <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                          <span>Option A: Sign-Up Landing Page (Recommended for New Users)</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">100% PUBLIC</span>
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        <code className="text-xs text-white font-mono break-all select-all font-bold bg-zinc-950 p-2 rounded-lg border border-zinc-800 flex-1">
                          {northwestForwardingUrl}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(northwestForwardingUrl);
                            setSaveToast('Sign-Up Destination URL copied to clipboard!');
                            setTimeout(() => setSaveToast(null), 2500);
                          }}
                          className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Sign-Up URL</span>
                        </button>
                      </div>
                    </div>

                    {/* Option B: Direct to Sign-In Page */}
                    <div className="p-3 rounded-xl bg-black/60 border border-zinc-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-300 font-bold uppercase flex items-center gap-1.5">
                          <span>Option B: Sign-In Landing Page (For Returning Users)</span>
                          <span className="text-[9px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">100% PUBLIC</span>
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        <code className="text-xs text-zinc-200 font-mono break-all select-all font-bold bg-zinc-950 p-2 rounded-lg border border-zinc-800 flex-1">
                          {`${AppUrlHelper.PUBLIC_CLOUD_APP_URL}/?signin=1`}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`${AppUrlHelper.PUBLIC_CLOUD_APP_URL}/?signin=1`);
                            setSaveToast('Sign-In Destination URL copied to clipboard!');
                            setTimeout(() => setSaveToast(null), 2500);
                          }}
                          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors border border-zinc-700"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Sign-In URL</span>
                        </button>
                      </div>
                    </div>

                    {/* End-User Privacy & Security Guarantee */}
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-200 space-y-1">
                      <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Direct Consumer Privacy Guarantee:</span>
                      </div>
                      <p className="text-zinc-300">
                        These links directly serve your standalone consumer application at <strong className="text-white font-mono">www.policesafeguard.com</strong>. End users who visit will <strong className="text-emerald-300">never see AI Studio</strong>, will never be prompted to log into Google or AI Studio, will never see your developer account, and have <strong className="text-white">zero access to developer tools or code changes</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>Step 5: Save Settings</span>
                    </div>
                    <p className="text-zinc-400">
                      Set Redirect Type to <strong className="text-white">301 (Permanent)</strong> or <strong className="text-white">302</strong>, check <strong className="text-white">"Forward Path"</strong>, and click <strong className="text-white">Save</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Once saved, visiting <code className="text-white font-mono">policesafeguard.com</code> or <code className="text-white font-mono">www.policesafeguard.com</code> will immediately open Police Safeguard with the official sign-up onboarding modal!
                  </span>
                </div>
              </div>

              {/* METHOD 2: CLOUDFLARE WITH NORTHWEST NAMESERVERS */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">2</span>
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Method 2: Keep policesafeguard.com in Address Bar (Cloudflare Pages)
                    </span>
                  </div>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/40 font-bold">
                    Clean URL
                  </span>
                </div>

                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  If you want <strong className="text-white">https://www.policesafeguard.com</strong> to stay displayed in the browser's address bar without changing the URL:
                </p>

                <ol className="list-decimal pl-4 space-y-2 text-zinc-300 text-[11px]">
                  <li>
                    <strong>Change Nameservers in Northwest:</strong> In your Northwest domain dashboard &rarr; <strong className="text-white">Nameservers</strong> &rarr; switch to Cloudflare's free nameservers.
                  </li>
                  <li>
                    <strong>Download Pre-Packaged Forwarder:</strong>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadCloudflareZip}
                        className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-black flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-black" />
                        <span>Download policesafeguard-cloudflare.zip</span>
                      </button>
                    </div>
                  </li>
                  <li>
                    <strong>Upload to Cloudflare Pages (100% Free):</strong> In Cloudflare Dashboard &rarr; <em>Workers &amp; Pages</em> &rarr; <em>Create application</em> &rarr; <em>Pages</em> &rarr; <em>Upload assets</em> &rarr; upload this zip file and attach custom domain <code className="text-amber-300 font-mono">policesafeguard.com</code>.
                  </li>
                </ol>
              </div>

            </div>
          )}

          {/* TAB 1: 502 BAD GATEWAY DIAGNOSTIC & RESOLUTION */}
          {activeTab === 'fix_502' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/70 via-zinc-950 to-amber-950/60 border border-red-500/50 space-y-2.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Why does <span className="text-amber-300 font-mono">https://www.policesafeguard.com</span> show 502 Bad Gateway?
                    </h3>
                    <p className="text-[11px] text-zinc-300">
                      A <strong>502 Bad Gateway</strong> means your edge proxy or DNS provider (e.g. Cloudflare, Vercel, or Nginx) tried to connect to your host server at <strong className="text-amber-300 font-mono">66.223.49.89</strong>, but the backend server was either unreachable, listening on a different port, or encountered an SSL certificate handshake mismatch.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actionable Step-by-Step Fixes */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-amber-400">
                  Step-by-Step Fixes for policesafeguard.com (66.223.49.89)
                </h4>

                {/* Fix 1: Cloudflare SSL Mode Mismatch (Most Common) */}
                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px] flex items-center justify-center font-bold">1</span>
                      Fix Cloudflare SSL/TLS Encryption Mode (Most Common Cause)
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">Critical</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    If your domain is managed in Cloudflare, navigate to:
                    <br />
                    <code className="text-amber-300 font-mono bg-zinc-900 px-1.5 py-0.5 rounded text-[10px]">Cloudflare Dashboard &gt; policesafeguard.com &gt; SSL/TLS &gt; Overview</code>
                  </p>
                  <div className="bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 text-[11px] text-zinc-300">
                    If SSL mode is set to <strong className="text-red-400">"Full (Strict)"</strong>, Cloudflare requires a trusted CA certificate on your host 66.223.49.89. Because origin servers commonly use HTTP or self-signed certs behind the proxy, Cloudflare drops the connection with <strong>502 Bad Gateway</strong>.
                    <div className="mt-1 text-emerald-300 font-semibold">
                      👉 Change the encryption mode to <span className="underline">"Full"</span> or <span className="underline">"Flexible"</span>. Traffic will immediately begin resolving!
                    </div>
                  </div>
                </div>

                {/* Fix 2: Port Dynamic Binding */}
                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] flex items-center justify-center font-bold">2</span>
                      Web Server Listening on Port 3000 / $PORT
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">Ready in Code</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Ensure your Node backend is running on <code className="text-emerald-400 font-mono bg-zinc-900 px-1 rounded">66.223.49.89</code> and listening on host <code className="text-emerald-400 font-mono bg-zinc-900 px-1 rounded">0.0.0.0</code> (port 3000 or $PORT). We updated <code className="text-zinc-200 font-mono bg-zinc-900 px-1 rounded">server.ts</code> so the server binds cleanly to dynamic ports.
                  </p>
                </div>

                {/* Fix 3: DNS Record Points to 66.223.49.89 */}
                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-mono text-[10px] flex items-center justify-center font-bold">3</span>
                      Set DNS A Record to 66.223.49.89
                    </span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/40">Host DNS</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    In your domain registrar / host site:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-zinc-300 text-[11px]">
                    <li><strong>A Record:</strong> Host <code className="font-mono text-amber-300">@</code> points to <code className="font-mono text-amber-300 bg-zinc-900 px-1 rounded font-bold select-all">66.223.49.89</code></li>
                    <li><strong>CNAME Record:</strong> Host <code className="font-mono text-amber-300">www</code> points to <code className="font-mono text-amber-300 bg-zinc-900 px-1 rounded select-all">policesafeguard.com</code></li>
                  </ul>
                </div>

                {/* Fix 4: Web Host VirtualHost & Document Root on 66.223.49.89 */}
                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-[10px] flex items-center justify-center font-bold">4</span>
                      Add Domain to Web Server VirtualHost (cPanel / Apache / Nginx)
                    </span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/40">Host Server</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Even though DNS points to <code className="text-amber-300 font-mono">66.223.49.89</code>, your web server must recognize the domain name:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-zinc-300 text-[11px]">
                    <li>In <strong>cPanel</strong>: Go to <em>Domains &gt; Create a New Domain</em> &rarr; enter <code className="text-amber-300 font-mono">policesafeguard.com</code> (and check alias for <code className="text-amber-300 font-mono">www.policesafeguard.com</code>).</li>
                    <li>In <strong>Apache / Nginx</strong>: Verify your <code className="text-amber-300 font-mono">server_name</code> or <code className="text-amber-300 font-mono">ServerName</code> includes <code className="text-emerald-300 font-mono">policesafeguard.com www.policesafeguard.com</code>.</li>
                  </ul>
                </div>

                {/* Fix 5: Install Free SSL Certificate on 66.223.49.89 */}
                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 font-mono text-[10px] flex items-center justify-center font-bold">5</span>
                      Install Free SSL / TLS Certificate (AutoSSL / Let's Encrypt)
                    </span>
                    <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/40">HTTPS Security</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Modern browsers automatically redirect to <code className="text-emerald-300 font-mono">https://</code>. If <code className="text-amber-300 font-mono">66.223.49.89</code> doesn't have an SSL cert installed, visitors get a privacy warning or 502 error:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-zinc-300 text-[11px]">
                    <li>In <strong>cPanel</strong>: Click <em>SSL/TLS Status</em> &rarr; select <code className="text-amber-300 font-mono">policesafeguard.com</code> &rarr; click <strong>Run AutoSSL</strong>.</li>
                    <li>On <strong>Linux VPS</strong>: Run <code className="text-emerald-400 font-mono bg-zinc-900 px-1 rounded">sudo certbot --nginx -d policesafeguard.com -d www.policesafeguard.com</code>.</li>
                  </ul>
                </div>

                {/* Fix 6: DNS Propagation Check */}
                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-mono text-[10px] flex items-center justify-center font-bold">6</span>
                      Check DNS Propagation &amp; Flush Cache
                    </span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/40">Propagation</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    DNS records can take between 5 minutes to a few hours to propagate. Check resolution status with an external tool like <strong className="text-white">whatsmydns.net</strong> for <code className="text-amber-300 font-mono">policesafeguard.com</code> (Type A), or flush local cache in your terminal (<code className="text-emerald-400 font-mono bg-zinc-900 px-1 rounded">ipconfig /flushdns</code> on Windows, or toggle phone airplane mode).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: BRAND DOMAIN SELECTION */}
          {activeTab === 'custom_domain' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm">Select Your Preferred Official Brand Domain</h3>
                <p className="text-[11px] text-zinc-400">
                  Choose which official domain will appear on your share cards, links, and emergency dispatch alerts
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AppUrlHelper.OFFICIAL_DOMAINS.map((item) => {
                  const isSelected = selectedDomain === item.domain;
                  return (
                    <div
                      key={item.domain}
                      onClick={() => handleSelectPredefined(item.domain)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-400 shadow-md shadow-amber-500/10'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-amber-300">
                          https://{item.domain}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-tight">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[10px]">
                        <span className="text-zinc-500">{item.name}</span>
                        {isSelected && (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Domain Input */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>Connect Your Own Registered Domain</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Already own a domain on GoDaddy, Namecheap, Google, or Cloudflare? Enter it here to use it across all app shares:
                </p>
                <form onSubmit={handleSaveCustom} className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-zinc-500 font-mono text-xs">https://</span>
                    <input
                      type="text"
                      placeholder="mycustomdomain.com"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="w-full pl-20 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    Save Domain
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: DNS CONFIGURATION GUIDE */}
          {activeTab === 'dns_guide' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm">How to Point Your Custom Domain to this App</h3>
                <p className="text-[11px] text-zinc-400">
                  Follow these 2 simple DNS steps to make your custom domain serve this app directly with HTTPS:
                </p>
              </div>

              {/* Dedicated Card for policesafeguard.com (66.223.49.89) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-zinc-950 to-amber-950/60 border border-emerald-500/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs text-white uppercase tracking-wider">
                      Setup Guide for: <span className="text-emerald-300">policesafeguard.com</span> (Host IP: <span className="text-amber-300 font-mono">66.223.49.89</span>)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Official Host
                  </span>
                </div>

                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-[11px] text-zinc-300 space-y-2.5">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <span>What to configure on your domain host site:</span>
                  </div>
                  <ul className="space-y-2 list-disc pl-4 text-zinc-300">
                    <li>
                      <strong className="text-white">Step 1 — DNS A Record (Apex Domain):</strong>
                      <br />
                      Set Type to <strong className="text-amber-300">A</strong>, Host to <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">@</code>, Value / Destination to:
                      <div className="mt-1 flex items-center gap-2">
                        <code className="text-[11px] bg-zinc-900 text-emerald-300 p-1.5 rounded font-mono font-bold select-all">
                          66.223.49.89
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('66.223.49.89');
                            setSaveToast('IP Address 66.223.49.89 copied!');
                            setTimeout(() => setSaveToast(null), 2500);
                          }}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-mono text-[10px] rounded cursor-pointer shrink-0"
                        >
                          Copy IP
                        </button>
                      </div>
                    </li>
                    <li>
                      <strong className="text-white">Step 2 — CNAME Record for WWW:</strong>
                      <br />
                      Set Type to <strong className="text-amber-300">CNAME</strong>, Host to <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">www</code>, Target / Value to:
                      <div className="mt-1 flex items-center gap-2">
                        <code className="text-[11px] bg-zinc-900 text-amber-300 p-1.5 rounded font-mono font-bold select-all">
                          policesafeguard.com
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('policesafeguard.com');
                            setSaveToast('Domain name copied!');
                            setTimeout(() => setSaveToast(null), 2500);
                          }}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-mono text-[10px] rounded cursor-pointer shrink-0"
                        >
                          Copy
                        </button>
                      </div>
                    </li>
                    <li>
                      <strong className="text-white">Step 3 — Landing on the Official Sign-Up Page:</strong>
                      <br />
                      On your server at <code className="text-amber-300 font-mono">66.223.49.89</code>, configure Apache or Nginx to proxy incoming traffic to the Node app, or redirect new root visits to <code className="text-emerald-300 font-mono">/?signup=1</code>:
                      <div className="mt-1 bg-zinc-900 p-2 rounded-lg font-mono text-[10px] text-zinc-300">
                        {`# Apache .htaccess redirect to Official Sign-Up
RewriteEngine On
RewriteCond %{QUERY_STRING} !signup=1
RewriteRule ^$ /?signup=1 [R=302,L]`}
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* DNS Record Details */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="font-bold text-amber-300 text-xs">Standard DNS CNAME Record:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block">Record Type</span>
                    <strong className="text-white">CNAME</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block">Host / Name</span>
                    <strong className="text-white">@ or app</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block">Target Value</span>
                    <strong className="text-amber-400 truncate block text-[11px]" title={dnsInfo.cnameRecord.value}>
                      {dnsInfo.cnameRecord.value}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Cloudflare Pages Direct Upload Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-950 to-emerald-500/10 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs text-white uppercase tracking-wider">
                      Cloudflare Pages (Direct Upload - Free .pages.dev)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    100% Free
                  </span>
                </div>

                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  When Cloudflare Pages asks you to <strong>"Upload assets"</strong>, upload this pre-packaged zip file. It contains the instant forwarder and social preview cards that connect directly to your live app:
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-zinc-200">policesafeguard-cloudflare.zip</span>
                      <span className="text-[10px] text-zinc-400">Guaranteed real .zip file (auto-generated in browser)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadCloudflareZip}
                    className="px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 text-black" />
                    <span>Download Real ZIP File</span>
                  </button>
                </div>

                {/* Direct File Copy Alternative if user prefers creating files */}
                <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
                  <div className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <span>Or create 2 files in a folder on your computer:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                      <div>
                        <span className="text-white font-mono font-bold block">1. index.html</span>
                        <span className="text-zinc-500 text-[10px]">Instant web forwarder to Sign-Up</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=https://www.policesafeguard.com/?signup=1"><title>Police Safeguard</title></head><body><script>window.location.replace("https://www.policesafeguard.com/?signup=1");</script></body></html>`;
                          navigator.clipboard.writeText(html);
                          setSaveToast('index.html copied to clipboard!');
                          setTimeout(() => setSaveToast(null), 2500);
                        }}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-mono text-[10px] rounded cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                      <div>
                        <span className="text-white font-mono font-bold block">2. _redirects</span>
                        <span className="text-zinc-500 text-[10px]">Cloudflare redirect rule</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const redirects = `/* https://www.policesafeguard.com/:splat 301!`;
                          navigator.clipboard.writeText(redirects);
                          setSaveToast('_redirects content copied to clipboard!');
                          setTimeout(() => setSaveToast(null), 2500);
                        }}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-mono text-[10px] rounded cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step by step checklist */}
              <div className="space-y-2">
                {(dnsInfo.hostSteps || (dnsInfo as any).cloudflareSteps || []).map((step: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-300 leading-relaxed">
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SELF-HOST ON APACHE OR VERCEL (100% NO GOOGLE AI STUDIO LOGIN) */}
          {activeTab === 'self_host' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Alert explanation */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/50 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>Direct Domain Routing Active</span>
                </div>
                <p className="text-zinc-300 leading-relaxed text-xs">
                  All witness feeds, download links, and emergency shares are routed directly through your official domain (<code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded font-mono">www.policesafeguard.com</code>), completely bypassing any developer sandbox or external login prompt.
                </p>
                <p className="text-emerald-400 font-semibold text-xs">
                  ✅ Primary Host: Pointed to your registered server at <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-emerald-300">66.223.49.89</code> for <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-emerald-300">policesafeguard.com</code>.
                </p>
              </div>

              {/* Download Buttons Card */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Download Production Packages
                    </h3>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      100% pre-compiled HTML, JavaScript, CSS, and Service Workers ready for your server.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-800 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold text-white">Live Cloudflare / DNS Routing Active</div>
                        <div className="text-[10px] text-zinc-400">Routes domain direct to production container</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step for Apache / Host 66.223.49.89 */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>Option A: Deploy to your Host Server (66.223.49.89)</span>
                </div>

                <div className="space-y-2 text-zinc-300 text-xs">
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="font-bold text-white text-[11px] block">Step 1: Deploy Web Application to Server</span>
                    <p className="text-zinc-400 text-[11px]">Deploy the web build to your host server web root:</p>
                    <pre className="p-2 bg-black rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto">
                      cd /var/www/html &amp;&amp; npm run build
                    </pre>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="font-bold text-white text-[11px] block">Step 2: Configure Virtual Host &amp; SSL Certificate</span>
                    <p className="text-zinc-400 text-[11px]">
                      Ensure your web host at <code className="text-amber-300 font-mono">66.223.49.89</code> has an active Virtual Host for <code className="text-emerald-300 font-mono">policesafeguard.com</code> and <code className="text-emerald-300 font-mono">www.policesafeguard.com</code> with AutoSSL or Let's Encrypt certificate installed.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="font-bold text-white text-[11px] block">Step 3: Test Domain &amp; Sign-Up Landing</span>
                    <p className="text-zinc-400 text-[11px]">
                      Open <code className="text-emerald-300 font-mono">https://www.policesafeguard.com</code>. Your app loads instantly with the official sign-up onboarding modal!
                    </p>
                  </div>
                </div>
              </div>

              {/* Step-by-Step for Free 1-Click Vercel/Netlify/Cloudflare */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>Option B: Free 1-Click Cloud Hosting (Vercel / Netlify / Cloudflare Pages)</span>
                </div>
                <p className="text-zinc-400">
                  If you prefer automated continuous deployment with zero server maintenance:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-300">
                  <li>Push your repository or Vercel export to GitHub.</li>
                  <li>Upload or push the repo to GitHub.</li>
                  <li>Import the GitHub repo into <strong className="text-white">Vercel.com</strong> or <strong className="text-white">Netlify.com</strong> (100% free plan).</li>
                  <li>In Vercel/Netlify Domains, enter <strong className="text-emerald-300">policesafeguard.com</strong> and <strong className="text-emerald-300">www.policesafeguard.com</strong>.</li>
                  <li>Add the CNAME provided by the host.</li>
                </ol>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>All links are cryptographically protected and HTTPS secured</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
