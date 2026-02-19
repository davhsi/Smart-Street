import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import jsQR from "jsqr";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function VerifyPermit() {
   const [qrCodeData, setQrCodeData] = useState("");
   const [permitId, setPermitId] = useState("");
   const [verifying, setVerifying] = useState(false);
   const [result, setResult] = useState(null);
   const [error, setError] = useState(null);
   const [dragActive, setDragActive] = useState(false);
   const fileInputRef = useRef(null);
   const { t } = useTranslation();

   const handleVerify = async (data = null) => {
      const codeToVerify = data || qrCodeData.trim() || permitId.trim();
      if (!codeToVerify) {
         setError("Please upload a QR code or enter data manually");
         return;
      }

      setVerifying(true);
      setError(null);
      setResult(null);

      try {
         let response;
         // Heuristic: If it looks like a UUID, treat as ID. Otherwise treat as QR Data (JWT).
         const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(codeToVerify);

         if (isUUID) {
            response = await api.get(`/public/verify-permit/${codeToVerify}`);
         } else {
            response = await api.post("/public/verify-permit", { qrCodeData: codeToVerify });
         }
         setResult(response.data);
         // Pre-fill fields for clarity if not already set
         if (!qrCodeData && !isUUID) setQrCodeData(codeToVerify);
         if (!permitId && isUUID) setPermitId(codeToVerify);
      } catch (err) {
         setError(err.response?.data?.message || "Verification failed. Invalid or expired permit.");
         setResult(null);
      } finally {
         setVerifying(false);
      }
   };

   const handleDrag = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
         setDragActive(true);
      } else if (e.type === "dragleave") {
         setDragActive(false);
      }
   };

   const processFile = (file) => {
      if (!file) return;

      // Check file type
      if (file.type !== "image/png" && file.type !== "image/jpeg") {
         setError("Please upload a valid image file (PNG or JPEG)");
         return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
         const img = new Image();
         img.onload = () => {
            // Create a larger canvas to ensure a "Quiet Zone" (white border) around the QR code
            // Scale up the image (Super Sampling) to help jsQR read dense codes
            const scale = 4;
            const padding = 40; // Larger padding for scaled image

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            // precise dimensions
            canvas.width = (img.width * scale) + (padding * 2);
            canvas.height = (img.height * scale) + (padding * 2);

            // Fill entire canvas with white (Contrast background)
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Disable smoothing to keep pixels sharp (Critical for QR)
            ctx.imageSmoothingEnabled = false;

            // Draw image scaled up and centered
            ctx.drawImage(img, padding, padding, img.width * scale, img.height * scale);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // Attempt scan
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
               inversionAttempts: "attemptBoth",
            });

            if (code) {
               console.log("QR Code found:", code.data);
               handleVerify(code.data);
            } else {
               console.warn("QR Scan failed. Orig Dimensions:", img.width, "x", img.height);
               setError("Could not read QR code. Please try a clearer image, or manually paste the text data.");
            }
         };
         img.src = e.target.result;
      };
      reader.readAsDataURL(file);
   };

   const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
         processFile(e.dataTransfer.files[0]);
      }
   };

   const handleFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
         processFile(e.target.files[0]);
      }
   };

   return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] relative overflow-hidden transition-colors duration-300">
         {/* Background Decor - Cyan/Teal based */}
         <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />
         <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-teal-500/20 rounded-full blur-[128px] pointer-events-none" />

         <header className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
            <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
               <Link to="/" className="group">
                  <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold tracking-[0.2em] mb-0.5">{t("smart_street")}</p>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                     {t("permit_verification")}
                  </h1>
               </Link>
               <div className="flex items-center gap-3">
                  <div className="hidden sm:block">
                     <LanguageSwitcher />
                  </div>
                  <Link
                     to="/public"
                     className="hidden sm:inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                     {t("browsing_map")}
                  </Link>
                  <Link
                     to="/login"
                     className="inline-flex items-center px-5 py-2 rounded-full text-sm font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-lg shadow-slate-900/20 dark:shadow-white/10"
                  >
                     {t("login")}
                  </Link>
               </div>
            </div>
         </header>

         <main className="relative mx-auto max-w-3xl px-6 py-12">
            <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl shadow-cyan-900/5 border border-white/50 dark:border-slate-700/50 p-8 md:p-10">

               {/* Header */}
               <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/30 mb-6">
                     <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">{t("verify_authenticity")}</h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                     {t("verify_description")}
                  </p>
               </div>

               <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-8">

                  {/* Drag & Drop Zone */}
                  <div
                     className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 ${dragActive
                        ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/20 scale-[1.02]"
                        : "border-slate-300 dark:border-slate-700 hover:border-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                     onDragEnter={handleDrag}
                     onDragLeave={handleDrag}
                     onDragOver={handleDrag}
                     onDrop={handleDrop}
                     onClick={() => fileInputRef.current.click()}
                  >
                     <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg"
                        className="hidden"
                        onChange={handleFileChange}
                     />

                     <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className={`w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-4 transition-transform ${dragActive ? "scale-110" : "group-hover:scale-110"}`}>
                           <svg className="w-8 h-8 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                           </svg>
                        </div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{t("upload_qr_code")}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t("drag_drop_hint")}</p>
                     </div>
                  </div>

                  <div className="relative">
                     <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                     </div>
                     <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-slate-500 font-medium">{t("or_enter_manually")}</span>
                     </div>
                  </div>

                  {/* Manual Input */}
                  <div className="space-y-4">
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t("data_or_permit_id")}</label>
                        <div className="relative">
                           <textarea
                              value={qrCodeData || permitId}
                              onChange={e => {
                                 const val = e.target.value;
                                 if (/^[0-9a-f-]{36}$/i.test(val)) {
                                    setPermitId(val);
                                    setQrCodeData("");
                                 } else {
                                    setQrCodeData(val);
                                    setPermitId("");
                                 }
                              }}
                              placeholder={t("paste_qr_placeholder")}
                              rows={1}
                              className="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-sm font-mono text-sm resize-none placeholder:text-slate-400"
                           />
                        </div>
                     </div>

                     <button
                        type="submit"
                        disabled={verifying}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-bold shadow-lg shadow-cyan-600/30 hover:shadow-cyan-600/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                     >
                        {verifying ? (
                           <span className="flex items-center justify-center gap-2">
                              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {t("verifying_blockchain")}
                           </span>
                        ) : t("verify_credentials")}
                     </button>
                  </div>
               </form>

               {/* Error State */}
               {error && (
                  <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                     <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-5 flex items-start gap-4">
                        <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                           <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                           </svg>
                        </div>
                        <div>
                           <h3 className="text-red-800 dark:text-red-300 font-bold mb-1">{t("verification_failed")}</h3>
                           <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                        </div>
                     </div>
                  </div>
               )}

               {/* Results State */}
               {result && (
                  <div className="mt-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                     <div className={`relative overflow-hidden rounded-2xl border ${result.valid ? "border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-900/10" : "border-yellow-200 bg-yellow-50/50"}`}>

                        {/* Result Header */}
                        <div className={`p-6 border-b ${result.valid ? "border-cyan-100 dark:border-cyan-800/50 bg-cyan-100/30 dark:bg-cyan-900/20" : "border-yellow-100 bg-yellow-100/30"} flex items-center justify-between`}>
                           <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${result.valid ? "bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-400" : "bg-yellow-100 text-yellow-700"}`}>
                                 {result.valid ? (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                 ) : (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                 )}
                              </div>
                              <div>
                                 <h3 className={`font-bold text-lg ${result.valid ? "text-cyan-900 dark:text-cyan-100" : "text-yellow-800"}`}>
                                    {result.valid ? t("verified_valid") : t("verification_failed")}
                                 </h3>
                                 <p className={`text-xs font-semibold uppercase tracking-wider ${result.valid ? "text-cyan-700/80 dark:text-cyan-400/80" : "text-yellow-600/80"}`}>
                                    {t("active_permit")}
                                 </p>
                              </div>
                           </div>
                        </div>

                        <div className="p-6">
                           {/* Blockchain Proof - Prominent */}
                           {result.permit?.transactionHash && (
                              <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm flex items-center justify-between group cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                       </svg>
                                    </div>
                                    <div>
                                       <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider mb-0.5">{t("blockchain_proof")}</p>
                                       <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("verified_immutable")}</p>
                                    </div>
                                 </div>
                                 <a
                                    href={`https://amoy.polygonscan.com/tx/${result.permit.transactionHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg shadow-sm border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                                 >
                                    {t("view_tx")}
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                 </a>
                              </div>
                           )}

                           {/* Permit Details Grid */}
                           {result.permit && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm mb-6">
                                 {[
                                    { label: t("vendor_label"), value: result.permit.vendorName },
                                    { label: t("business_label"), value: result.permit.businessName },
                                    { label: t("category_label"), value: result.permit.category },
                                    { label: t("license_label"), value: result.permit.licenseNumber },
                                    { label: t("space_label"), value: result.permit.spaceName },
                                    { label: t("address_label"), value: result.permit.address },
                                    { label: t("valid_from_label"), value: new Date(result.permit.validFrom).toLocaleString() },
                                    { label: t("valid_until_label"), value: new Date(result.permit.validTo).toLocaleString() },
                                 ].map((item, i) => (
                                    <div key={i} className="flex flex-col">
                                       <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{item.label}</span>
                                       <span className="text-slate-800 dark:text-slate-200 font-semibold border-b border-dotted border-slate-300 dark:border-slate-700 pb-1">{item.value}</span>
                                    </div>
                                 ))}
                              </div>
                           )}

                           {/* Technical Checks */}
                           {result.checks && (
                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                 <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">{t("system_validations")}</h4>
                                 <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(result.checks).map(([key, val]) => (
                                       <div key={key} className="flex items-center gap-2">
                                          <div className={`w-1.5 h-1.5 rounded-full ${val ? "bg-green-500" : "bg-red-500"}`} />
                                          <span className={`text-xs font-medium ${val ? "text-slate-600 dark:text-slate-300" : "text-red-500"}`}>
                                             {key.replace(/([A-Z])/g, ' $1').trim()}: {val ? "PASS" : "FAIL"}
                                          </span>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           )}

                        </div>
                     </div>
                  </div>
               )}

            </div>
         </main>
      </div>
   );
}
