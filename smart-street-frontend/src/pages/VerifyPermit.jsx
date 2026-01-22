import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.jsx";

export default function VerifyPermit() {
  const [qrCodeData, setQrCodeData] = useState("");
  const [permitId, setPermitId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async e => {
    e.preventDefault();
    const codeToVerify = qrCodeData.trim() || permitId.trim();
    if (!codeToVerify) {
      setError("Please enter QR code data or permit ID");
      return;
    }

    setVerifying(true);
    setError(null);
    setResult(null);

    try {
      let response;
      if (qrCodeData.trim()) {
        response = await api.post("/public/verify-permit", { qrCodeData: qrCodeData.trim() });
      } else {
        response = await api.get(`/public/verify-permit/${permitId.trim()}`);
      }
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
      setResult(null);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-700 font-semibold tracking-[0.2em]">SMART STREET</p>
            <h1 className="text-lg font-bold text-slate-900">Permit Verification</h1>
            <p className="text-xs text-slate-600">Verify vendor permits using QR code or permit ID</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/public"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Browse Vendors
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                QR Code Data (JWT token)
              </label>
              <textarea
                value={qrCodeData}
                onChange={e => setQrCodeData(e.target.value)}
                placeholder="Paste QR code data here..."
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-center text-sm text-slate-500">OR</div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Permit ID</label>
              <input
                type="text"
                value={permitId}
                onChange={e => setPermitId(e.target.value)}
                placeholder="Enter permit ID..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {verifying ? "Verifying..." : "Verify Permit"}
            </button>
          </form>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-800">Verification Failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div
                className={`rounded-lg p-4 ${
                  result.valid
                    ? "bg-green-50 border border-green-200"
                    : "bg-yellow-50 border border-yellow-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {result.valid ? (
                    <>
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm font-semibold text-green-800">Permit Valid</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm font-semibold text-yellow-800">Permit Invalid</p>
                    </>
                  )}
                </div>

                {result.permit && (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-semibold text-slate-700">Business:</span> {result.permit.businessName}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Category:</span> {result.permit.category}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Vendor:</span> {result.permit.vendorName}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">License:</span> {result.permit.licenseNumber}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Space:</span> {result.permit.spaceName}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Address:</span> {result.permit.address}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Valid From:</span>{" "}
                        {new Date(result.permit.validFrom).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Valid To:</span>{" "}
                        {new Date(result.permit.validTo).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {result.checks && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Validation Checks:</p>
                    <div className="space-y-1 text-xs">
                      <div className={`${result.checks.permitStatus ? "text-green-700" : "text-red-700"}`}>
                        ✓ Permit Status: {result.checks.permitStatus ? "VALID" : "INVALID"}
                      </div>
                      <div className={`${result.checks.timeValidity ? "text-green-700" : "text-red-700"}`}>
                        ✓ Time Validity: {result.checks.timeValidity ? "WITHIN WINDOW" : "OUTSIDE WINDOW"}
                      </div>
                      <div className={`${result.checks.requestStatus ? "text-green-700" : "text-red-700"}`}>
                        ✓ Request Status: {result.checks.requestStatus ? "APPROVED" : "NOT APPROVED"}
                      </div>
                      <div className={`${result.checks.spatialCorrectness ? "text-green-700" : "text-red-700"}`}>
                        ✓ Spatial Correctness: {result.checks.spatialCorrectness ? "VALID" : "INVALID"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
