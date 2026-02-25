import { PaperAirplaneIcon, HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { HeartIcon as HeartIconOutline } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

export default function VendorActionBar({
  intent,
  form,
  setForm,
  requestedRadius,
  setRequestedRadius,
  ownerDefinedRadius,
  pricePerRadius,
  handleSubmit,
  saving,
  isFavorite,
  onToggleFavorite,
  showFavorite,
  className = ""
}) {
  const { t } = useTranslation();
  const isOwnerDefined = intent === "OWNER_DEFINED";
  const isRequestNew = intent === "REQUEST_NEW";

  const currentRadius = isOwnerDefined ? ownerDefinedRadius : (requestedRadius || 0);
  const estimatedPrice = currentRadius * (pricePerRadius || 0);

  return (
    <div className={`
      fixed left-0 right-0 z-[20] transition-all duration-300
      bottom-0 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]
      md:absolute md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-4xl md:px-4 md:bg-transparent md:dark:bg-transparent md:border-none md:shadow-none
    ${className}`}>

      {/* Scrollable container for small screens if needed, or just stacked */}
      <form
        onSubmit={handleSubmit}
        className={`
          flex flex-col gap-3 p-4 pb-safe
          md:bg-white/95 md:dark:bg-slate-900/95 md:backdrop-blur-md md:shadow-2xl md:rounded-2xl md:border md:border-slate-200 md:dark:border-slate-800 md:p-5 md:flex-row md:items-end
        `}
      >
        {/* Mobile Handle / Indicator (Optional visual cue) */}
        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto md:hidden mb-2"></div>

        <div className="flex-1 w-full grid grid-cols-2 gap-3">
          <div>
            <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-1">{t('start_time')}</label>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="w-full text-lg rounded-lg border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 py-2 px-3 bg-slate-50 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-1">{t('end_time')}</label>
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="w-full text-lg rounded-lg border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 py-2 px-3 bg-slate-50 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>
        </div>

        {/* Radius Input */}
        <div className="w-full md:w-32 lg:w-48">
          <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t('radius_m')} <span className="md:hidden lg:inline">{isOwnerDefined && <span className="text-slate-400 font-normal">{t('fixed_label')}</span>}</span>
          </label>
          <input
            type="number"
            value={isOwnerDefined ? ownerDefinedRadius : requestedRadius}
            onChange={(e) => setRequestedRadius(e.target.value)}
            disabled={isOwnerDefined}
            placeholder={t('radius_placeholder')}
            className={`w-full text-lg rounded-lg border-slate-200 dark:border-slate-700 py-2 px-3 ${isOwnerDefined ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed" : "bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              }`}
          />
        </div>

        {/* Price Estimate */}
        {estimatedPrice > 0 && (
          <div className="w-full md:w-auto px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-center md:text-left">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('estimated_price') || 'Estimated Price'}</p>
            <p className="text-xl font-black text-blue-700 dark:text-blue-300">
              <span className="text-sm font-medium opacity-70">₹</span> {estimatedPrice.toLocaleString()}
            </p>
          </div>
        )}

        {/* Favorite Toggle */}
        {showFavorite && (
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`p-3 rounded-xl border-2 transition-all active:scale-95 ${isFavorite
                ? "bg-rose-50 border-rose-200 text-rose-500 shadow-sm"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400"
              }`}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? <HeartIconSolid className="w-6 h-6" /> : <HeartIconOutline className="w-6 h-6" />}
          </button>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving || !intent}
          className={`shrink-0 w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 ${saving
            ? "bg-slate-300 text-slate-500 cursor-wait"
            : !intent
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200"
            }`}
        >
          {saving ? (
            t('submitting')
          ) : (
            <>
              <PaperAirplaneIcon className="w-4 h-4" />
              <span>{t('submit_request')}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
