"use client";

import { useState, useCallback, useRef } from "react";
import { X, Upload, FileText, ClipboardPaste, ExternalLink, Check, AlertCircle } from "lucide-react";
import { GearItem, GearCategory } from "@/data/gear-database";
import { usePackStore } from "@/store/pack-store";
import {
  ParsedItem,
  parseCSVPreview,
  applyCSVMapping,
  parseText,
  ColumnMapping,
  CSVParseResult,
  mapCategory,
} from "@/utils/import-parser";

type Tab = "lighterpack" | "csv" | "paste";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("lighterpack");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-2xl max-h-[90vh] mx-4 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-[15px] font-bold tracking-wide text-white">
            Import Gear List
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <TabButton
            active={activeTab === "lighterpack"}
            onClick={() => setActiveTab("lighterpack")}
            icon={<ExternalLink className="w-3.5 h-3.5" />}
            label="LighterPack"
          />
          <TabButton
            active={activeTab === "csv"}
            onClick={() => setActiveTab("csv")}
            icon={<FileText className="w-3.5 h-3.5" />}
            label="CSV / Excel"
          />
          <TabButton
            active={activeTab === "paste"}
            onClick={() => setActiveTab("paste")}
            icon={<ClipboardPaste className="w-3.5 h-3.5" />}
            label="Paste Text"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "lighterpack" && <LighterPackTab onClose={onClose} />}
          {activeTab === "csv" && <CSVTab onClose={onClose} />}
          {activeTab === "paste" && <PasteTab onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-[12px] font-medium tracking-wide transition-colors border-b-2 ${
        active
          ? "border-lime-400 text-lime-400"
          : "border-transparent text-white/40 hover:text-white/70"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────
// TAB 1: LighterPack
// ────────────────────────────────────────────────────────────────────

function LighterPackTab({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState("");
  const shareCode = extractShareCode(url);

  return (
    <div className="space-y-5">
      {/* URL Input */}
      <div>
        <label className="block text-[12px] font-medium text-white/60 mb-2 uppercase tracking-wide">
          LighterPack URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://lighterpack.com/r/xyz123"
          className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-lime-400/50 transition-colors"
        />
        {shareCode && (
          <p className="mt-2 text-[12px] text-lime-400/70">
            Share code detected: <span className="font-mono">{shareCode}</span>
          </p>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-lime-400/70 mt-0.5 shrink-0" />
          <div className="space-y-2 text-[13px] text-white/60">
            <p className="font-medium text-white/80">
              How to export from LighterPack:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-[12px]">
              <li>Open your list on lighterpack.com</li>
              <li>
                Click the <span className="text-white/90 font-medium">Export</span> button
                (top right of your list)
              </li>
              <li>
                Select <span className="text-white/90 font-medium">CSV</span>
              </li>
              <li>
                Switch to the{" "}
                <span className="text-lime-400 font-medium">CSV / Excel</span>{" "}
                tab above and upload or paste the exported file
              </li>
            </ol>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-white/30">
        LighterPack doesn&apos;t provide a public API, so direct URL import isn&apos;t
        possible. Use their built-in CSV export instead.
      </p>
    </div>
  );
}

function extractShareCode(url: string): string | null {
  const match = url.match(/lighterpack\.com\/r\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// ────────────────────────────────────────────────────────────────────
// TAB 2: CSV / Excel
// ────────────────────────────────────────────────────────────────────

function CSVTab({ onClose }: { onClose: () => void }) {
  const [csvText, setCsvText] = useState("");
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addItem } = usePackStore();

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      const result = parseCSVPreview(text);
      setParseResult(result);
      setMapping(result.suggestedMapping);
      setImportedCount(null);
    };
    reader.readAsText(file);
  }, []);

  const handleParse = () => {
    if (!csvText.trim()) return;
    const result = parseCSVPreview(csvText);
    setParseResult(result);
    setMapping(result.suggestedMapping);
    setImportedCount(null);
  };

  const handleImport = () => {
    if (!parseResult || !mapping) return;
    const items = applyCSVMapping(parseResult.rows, mapping);
    importItems(items, addItem);
    setImportedCount(items.length);
  };

  const previewItems = parseResult && mapping
    ? applyCSVMapping(parseResult.rows.slice(0, 5), mapping)
    : [];

  const totalItems = parseResult && mapping
    ? applyCSVMapping(parseResult.rows, mapping).length
    : 0;

  return (
    <div className="space-y-4">
      {/* File upload */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={handleFile}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.05] border border-white/10 text-[13px] text-white/70 hover:text-white hover:border-white/20 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload CSV / TSV
        </button>
        <span className="text-[11px] text-white/30">
          .csv, .tsv, or .txt
        </span>
      </div>

      {/* Or paste directly */}
      <div>
        <label className="block text-[12px] font-medium text-white/60 mb-2 uppercase tracking-wide">
          Or paste CSV content
        </label>
        <textarea
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            setParseResult(null);
            setMapping(null);
            setImportedCount(null);
          }}
          placeholder={"Name, Weight, Unit, Category\nULA Circuit, 39, oz, Pack\nNemo Tensor, 15, oz, Sleep System"}
          rows={5}
          className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-lime-400/50 transition-colors font-[family-name:var(--font-jetbrains-mono)] resize-none"
        />
        {!parseResult && (
          <button
            onClick={handleParse}
            disabled={!csvText.trim()}
            className="mt-2 px-4 py-2 rounded-lg bg-lime-400/20 text-lime-400 text-[12px] font-bold tracking-wider uppercase hover:bg-lime-400/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Parse
          </button>
        )}
      </div>

      {/* Column mapping */}
      {parseResult && mapping && (
        <div className="space-y-3">
          <h4 className="text-[12px] font-bold text-white/70 uppercase tracking-wide">
            Column Mapping
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {(["name", "brand", "category", "weight", "unit", "price"] as const).map(
              (field) => (
                <div key={field} className="flex items-center gap-2">
                  <span className="text-[11px] text-white/50 w-16 capitalize">
                    {field}
                  </span>
                  <select
                    value={mapping[field]}
                    onChange={(e) =>
                      setMapping({ ...mapping, [field]: parseInt(e.target.value) })
                    }
                    className="flex-1 bg-white/[0.05] border border-white/10 rounded-md px-2 py-1.5 text-[11px] text-white outline-none focus:border-lime-400/50"
                  >
                    <option value={-1} className="bg-[#1a1a1a]">
                      — skip —
                    </option>
                    {parseResult.headers.map((h, i) => (
                      <option key={i} value={i} className="bg-[#1a1a1a]">
                        {h || `Column ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )
            )}
          </div>

          {/* Preview */}
          {previewItems.length > 0 && (
            <div className="mt-3">
              <h4 className="text-[11px] font-bold text-white/50 uppercase tracking-wide mb-2">
                Preview ({Math.min(5, totalItems)} of {totalItems} items)
              </h4>
              <div className="space-y-1">
                {previewItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 bg-white/[0.03] rounded-md"
                  >
                    <span className="text-[12px] text-white truncate">
                      {item.brand ? `${item.brand} ` : ""}
                      {item.name}
                    </span>
                    <span className="text-[11px] text-white/50 font-mono shrink-0 ml-2">
                      {item.weightOz.toFixed(1)} oz
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import button */}
          {importedCount === null ? (
            <button
              onClick={handleImport}
              disabled={totalItems === 0}
              className="w-full mt-3 py-2.5 rounded-lg bg-lime-400/20 text-lime-400 text-[12px] font-bold tracking-wider uppercase hover:bg-lime-400/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Import {totalItems} item{totalItems !== 1 ? "s" : ""}
            </button>
          ) : (
            <SuccessMessage count={importedCount} onClose={onClose} />
          )}
        </div>
      )}

      {/* Excel note */}
      <p className="text-[11px] text-white/30">
        For Excel files (.xlsx), open in Excel or Google Sheets and save as CSV first.
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// TAB 3: Paste Text
// ────────────────────────────────────────────────────────────────────

function PasteTab({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [parsedItems, setParsedItems] = useState<ParsedItem[] | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const { addItem } = usePackStore();

  const handleParse = () => {
    const items = parseText(text);
    setParsedItems(items);
    setImportedCount(null);
  };

  const handleImport = () => {
    if (!parsedItems) return;
    importItems(parsedItems, addItem);
    setImportedCount(parsedItems.length);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[12px] font-medium text-white/60 mb-2 uppercase tracking-wide">
          Paste your gear list
        </label>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setParsedItems(null);
            setImportedCount(null);
          }}
          placeholder={`Nemo Hornet 2P - 30 oz\nTherm-a-Rest NeoAir XLite, 12oz\nSawyer Squeeze (3 oz)\nULA Circuit\t39\toz`}
          rows={8}
          className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-lime-400/50 transition-colors font-[family-name:var(--font-jetbrains-mono)] resize-none"
        />
        <p className="mt-1.5 text-[11px] text-white/30">
          One item per line. We&apos;ll auto-detect weights in formats like &quot;12
          oz&quot;, &quot;340g&quot;, &quot;2.5 lb&quot;.
        </p>
      </div>

      {!parsedItems && (
        <button
          onClick={handleParse}
          disabled={!text.trim()}
          className="px-4 py-2 rounded-lg bg-lime-400/20 text-lime-400 text-[12px] font-bold tracking-wider uppercase hover:bg-lime-400/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Parse
        </button>
      )}

      {/* Preview */}
      {parsedItems && importedCount === null && (
        <div className="space-y-3">
          <h4 className="text-[11px] font-bold text-white/50 uppercase tracking-wide">
            Parsed {parsedItems.length} item{parsedItems.length !== 1 ? "s" : ""}
          </h4>

          {parsedItems.length === 0 ? (
            <p className="text-[12px] text-white/40">
              No items could be parsed. Try a different format.
            </p>
          ) : (
            <>
              <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1">
                {parsedItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 bg-white/[0.03] rounded-md"
                  >
                    <span className="text-[12px] text-white truncate">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-white/50 font-mono shrink-0 ml-2">
                      {item.weightOz.toFixed(1)} oz
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleImport}
                className="w-full py-2.5 rounded-lg bg-lime-400/20 text-lime-400 text-[12px] font-bold tracking-wider uppercase hover:bg-lime-400/30 transition-colors"
              >
                Import {parsedItems.length} item{parsedItems.length !== 1 ? "s" : ""}
              </button>
            </>
          )}
        </div>
      )}

      {importedCount !== null && (
        <SuccessMessage count={importedCount} onClose={onClose} />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Shared helpers
// ────────────────────────────────────────────────────────────────────

function SuccessMessage({ count, onClose }: { count: number; onClose: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-lime-400/10 border border-lime-400/20 rounded-lg">
      <Check className="w-5 h-5 text-lime-400 shrink-0" />
      <div className="flex-1">
        <p className="text-[13px] text-lime-400 font-medium">
          Successfully imported {count} item{count !== 1 ? "s" : ""}!
        </p>
        <p className="text-[11px] text-white/40 mt-0.5">
          Items have been added to your current loadout.
        </p>
      </div>
      <button
        onClick={onClose}
        className="px-3 py-1.5 rounded-md bg-lime-400/20 text-lime-400 text-[11px] font-bold hover:bg-lime-400/30 transition-colors"
      >
        Done
      </button>
    </div>
  );
}

/**
 * Import parsed items into the pack store.
 */
function importItems(
  items: ParsedItem[],
  addItem: (item: GearItem) => void
) {
  const timestamp = Date.now();
  items.forEach((parsed, index) => {
    const gearItem: GearItem = {
      id: `custom-import-${timestamp}-${index}`,
      name: parsed.name,
      brand: parsed.brand || "Imported",
      category: parsed.category || "accessories",
      weightOz: parsed.weightOz,
      priceUsd: parsed.price || 0,
      description: "Imported item",
    };
    addItem(gearItem);
  });
}
