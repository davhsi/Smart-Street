import { useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

export default function PermitQRModal({ isOpen, onClose, permit }) {
  const qrRef = useRef();

  if (!permit) return null;

  // Data to embed in the QR code
  const qrData = JSON.stringify({
    permit_id: permit.permit_id,
    vendor_id: permit.vendor_id,
    space_name: permit.Space?.space_name,
    valid_until: permit.valid_to,
    type: "SMART_STREET_PERMIT"
  });

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `permit-${permit.permit_id}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[3000]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-xl transition-all border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-start mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold leading-6 text-slate-900 dark:text-white"
                  >
                    Permit Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-slate-500" />
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left: QR Code */}
                  <div className="flex flex-col items-center space-y-4">
                    <div 
                      ref={qrRef}
                      className="p-3 bg-white rounded-xl shadow-sm border border-slate-200"
                    >
                      <QRCodeCanvas
                        value={qrData}
                        size={180}
                        level={"H"}
                        includeMargin={true}
                      />
                    </div>
                    <button
                      onClick={downloadQR}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Save QR
                    </button>
                  </div>

                  {/* Right: Text Details */}
                  <div className="flex-1 space-y-4 text-sm">
                     <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Permit ID</p>
                        <p className="font-mono font-bold text-slate-900 dark:text-white">#{permit.permit_id}</p>
                     </div>

                     <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Location</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{permit.Space?.space_name || "Assigned Location"}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{permit.Space?.address}</p>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <p className="text-xs text-slate-500 uppercase tracking-wide">Valid From</p>
                           <p className="text-slate-800 dark:text-slate-200">{new Date(permit.valid_from).toLocaleDateString()}</p>
                        </div>
                        <div>
                           <p className="text-xs text-slate-500 uppercase tracking-wide">Expires</p>
                           <p className="text-slate-800 dark:text-slate-200">{new Date(permit.valid_to).toLocaleDateString()}</p>
                        </div>
                     </div>
                     
                     <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800/50">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                           <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase">Active Permit</p>
                        </div>
                        <p className="text-[10px] text-green-600 dark:text-green-500 mt-1 leading-relaxed">
                           Authorized for use. Present QR to enforcement officers upon request.
                        </p>
                     </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
