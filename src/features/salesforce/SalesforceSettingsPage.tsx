import React, { useState, useEffect } from 'react';
import { SalesforceApiClient } from '../../services/salesforceApiClient';
import { ShieldCheck, Cloud, RefreshCw, Power, AlertTriangle, ExternalLink, Database, Key } from 'lucide-react';

export const SalesforceSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [status, setStatus] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check URL parameters for OAuth status redirects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    const success = params.get('status');
    if (err) {
      setErrorMsg(`Salesforce OAuth Error: ${decodeURIComponent(err)}`);
    } else if (success === 'success') {
      setErrorMsg(null);
    }
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await SalesforceApiClient.checkConnectionStatus();
      setStatus(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    // Initiate OAuth 2.0 PKCE flow on Express server
    window.location.href = 'http://localhost:3001/auth/salesforce';
  };

  const handleVerify = async () => {
    setVerifying(true);
    setErrorMsg(null);
    try {
      const res = await SalesforceApiClient.verifyConnection();
      setVerificationResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification call failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this Salesforce session?')) return;
    try {
      await SalesforceApiClient.disconnect();
      setVerificationResult(null);
      await fetchStatus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Disconnect failed');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Cloud className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Salesforce Integration Gateway</h1>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            Enterprise OAuth 2.0 Authorization Code with PKCE and Apex REST Service Connectivity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-rose-900">Configuration or OAuth Notice</h4>
            <p className="text-xs text-rose-700 mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Connection Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Live Org Connection Status
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                status?.connected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {status?.connected ? 'Connected (Authorized Org)' : 'Disconnected (Local Mode)'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="text-xs text-slate-500 font-medium">Salesforce Instance URL</div>
              <div className="font-semibold text-slate-900 break-all">
                {status?.instanceUrl || 'Not Connected'}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="text-xs text-slate-500 font-medium">Target API Version</div>
              <div className="font-semibold text-slate-900">{status?.apiVersion || 'v60.0'}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="text-xs text-slate-500 font-medium">Authenticated Username</div>
              <div className="font-semibold text-slate-900 break-all">
                {status?.username || 'No Active Salesforce Session'}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="text-xs text-slate-500 font-medium">OAuth Authentication Protocol</div>
              <div className="font-semibold text-indigo-700">
                OAuth 2.0 PKCE (External Client App)
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!status?.connected ? (
              <button
                onClick={handleConnect}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm transition"
              >
                <Key className="w-4 h-4" />
                Connect Salesforce Playground
              </button>
            ) : (
              <>
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-sm transition"
                >
                  <ShieldCheck className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
                  Verify Live Connection
                </button>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-sm font-semibold hover:bg-rose-100 transition"
                >
                  <Power className="w-4 h-4" />
                  Disconnect Session
                </button>
              </>
            )}
          </div>

          {verificationResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
              <div className="font-semibold text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Live Salesforce API Identity Confirmed
              </div>
              <pre className="text-xs text-emerald-800 mt-2 bg-emerald-100/50 p-2 rounded overflow-x-auto">
                {JSON.stringify(verificationResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Security & Guidance Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 text-sm">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Security & Zero-Leakage Policy
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-600 list-disc list-inside">
            <li>
              <strong>Tokens Stored on Backend:</strong> Salesforce access and refresh tokens are strictly held in server-side session memory.
            </li>
            <li>
              <strong>Zero Frontend Exposure:</strong> React never receives tokens; browser authentication uses HttpOnly cookies.
            </li>
            <li>
              <strong>Authoritative Calculations:</strong> Taxes and payments are calculated directly in Apex, not in the browser.
            </li>
            <li>
              <strong>Single Integration User:</strong> Demonstrations run through an authorized integration principal with FLS and user-mode enforcement.
            </li>
          </ul>

          <div className="pt-2 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-700 mb-1">External Client App Setup:</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Callback URI must be set to: <br />
              <code className="text-indigo-600 font-mono">http://localhost:3001/auth/salesforce/callback</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
