import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, CalendarIcon, MapPinIcon, ClockIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

export default function RequestDetailModal({ isOpen, onClose, request }) {
  if (!request) return null;

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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-xl transition-all border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-start mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold leading-6 text-slate-900 dark:text-white flex items-center gap-2"
                  >
                    <ClipboardDocumentListIcon className="w-5 h-5 text-blue-500" />
                    Request Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-slate-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-xl border ${
                    request.status === 'APPROVED' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                    request.status === 'REJECTED' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                    'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        request.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        request.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    {request.remarks && (
                      <div className={`mt-3 pt-3 border-t ${
                        request.status === 'REJECTED' ? 'border-red-200 dark:border-red-800/50' :
                        request.status === 'APPROVED' ? 'border-green-200 dark:border-green-800/50' :
                        'border-slate-200 dark:border-slate-700'
                      }`}>
                         <p className={`text-xs font-bold mb-1 ${
                            request.status === 'REJECTED' ? 'text-red-600 dark:text-red-400' :
                            request.status === 'APPROVED' ? 'text-green-600 dark:text-green-400' :
                            'text-slate-600 dark:text-slate-400'
                         }`}>Admin Remarks:</p>
                         <p className={`text-sm ${
                            request.status === 'REJECTED' ? 'text-red-700 dark:text-red-300' :
                            request.status === 'APPROVED' ? 'text-green-700 dark:text-green-300' :
                            'text-slate-700 dark:text-slate-300'
                         }`}>{request.remarks}</p>
                      </div>
                    )}
                  </div>

                  {/* ID & Date */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Request ID</p>
                      <p className="font-mono text-slate-900 dark:text-white">#{request.request_id}</p>
                    </div>
                    <div>
                       <p className="text-xs text-slate-500 dark:text-slate-400">Submitted On</p>
                       <p className="text-slate-900 dark:text-white">{new Date(request.submitted_at).toLocaleDateString()} {new Date(request.submitted_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1">Location Info</h4>
                    
                    <div className="flex items-start gap-3">
                       <MapPinIcon className="w-5 h-5 text-slate-400 mt-0.5" />
                       <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{request.space_name || "Custom Location"}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{request.address || `${Number(request.lat).toFixed(6)}, ${Number(request.lng).toFixed(6)}`}</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pl-8">
                       <div>
                          <p className="text-xs text-slate-500">Requested Area</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {Math.round(Math.sqrt((request.max_width ** 2 + request.max_length ** 2)) / 2)}m Radius
                          </p>
                       </div>
                    </div>
                  </div>

                   {/* Time Info */}
                   <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1">Time & Duration</h4>
                    
                    <div className="flex items-start gap-3">
                       <ClockIcon className="w-5 h-5 text-slate-400 mt-0.5" />
                       <div className="grid grid-cols-2 gap-x-8 gap-y-2 w-full">
                          <div>
                            <p className="text-xs text-slate-500">Starts</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{new Date(request.start_time).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Ends</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{new Date(request.end_time).toLocaleString()}</p>
                          </div>
                       </div>
                    </div>
                  </div>

                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-xl border border-transparent bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
