import { useMap } from "react-leaflet";
import { PlusIcon, MinusIcon, ArrowsPointingOutIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { MapPinIcon } from "@heroicons/react/24/solid";

export default function MapZoomLocationControls({
  mapStyle,
  setMapStyle,
  isFullscreen,
  onToggleFullscreen,
  showFullscreenButton,
  className = "absolute top-24 right-4 z-[1000] flex flex-col gap-2"
}) {
  const map = useMap();

  const handleZoomIn = (e) => {
    e.stopPropagation();
    map.zoomIn();
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    map.zoomOut();
  };

  const handleLocate = (e) => {
    e.stopPropagation();
    map.locate({ setView: true, maxZoom: 16 });
  };

  // Prevent clicks from propagating to map (dragging etc)
  const disablePropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className={className}
      onDoubleClick={disablePropagation}
      onMouseDown={disablePropagation}
      onClick={disablePropagation}
      onTouchStart={disablePropagation}
    >
      {/* Fullscreen Button */}
      {showFullscreenButton && (
        <div className="relative group/tooltip">
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-md border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center w-14 h-14 transform active:scale-95"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <XMarkIcon className="h-8 w-8 text-slate-700 dark:text-slate-200" />
            ) : (
              <ArrowsPointingOutIcon className="h-8 w-8 text-slate-700 dark:text-slate-200" />
            )}
          </button>
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
            {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          </div>
        </div>
      )}

      {/* Location Button */}
      <div className="relative group/tooltip">
        <button
          onClick={handleLocate}
          className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-md border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center w-14 h-14"
          title="Show Your Location"
          type="button"
        >
          <MapPinIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </button>
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
          My Location
        </div>
      </div>

      <div className="flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-300 dark:border-slate-600 overflow-hidden">
        <div className="relative group/tooltip">
          <button
            onClick={handleZoomIn}
            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center w-14 h-14 border-b border-slate-200 dark:border-slate-600"
            title="Zoom In"
            type="button"
          >
            <PlusIcon className="h-8 w-8 text-slate-700 dark:text-slate-200" />
          </button>
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
            Zoom In
          </div>
        </div>
        <div className="relative group/tooltip">
          <button
            onClick={handleZoomOut}
            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center w-14 h-14"
            title="Zoom Out"
            type="button"
          >
            <MinusIcon className="h-8 w-8 text-slate-700 dark:text-slate-200" />
          </button>
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
            Zoom Out
          </div>
        </div>
      </div>

      {/* Satellite Toggle Button - Integrated vertically */}
      <div className="relative group/tooltip">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMapStyle(prev => prev === "street" ? "satellite" : "street");
          }}
          className={`bg-white dark:bg-slate-800 rounded-lg shadow-md border transition-all w-14 h-14 flex items-center justify-center group/btn overflow-hidden transform active:scale-95 ${mapStyle === 'satellite' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-300 dark:border-slate-600'
            }`}
          title={mapStyle === "street" ? "Switch to Satellite" : "Switch to Street Map"}
        >
          <div className={`w-8 h-8 rounded-md transition-all duration-300 border border-slate-200 dark:border-slate-700 ${mapStyle === 'street'
            ? 'bg-[url("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/15/15000/10000")] bg-cover'
            : 'bg-[url("https://a.tile.openstreetmap.org/15/15000/10000.png")] bg-cover'
            }`}></div>
        </button>
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
          {mapStyle === "street" ? "Switch to Satellite" : "Switch to Street Map"}
        </div>
      </div>
    </div>
  );
}
