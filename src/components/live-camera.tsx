import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Image as ImageIcon, Sparkles, Loader2, RotateCcw } from "lucide-react";

type Props = {
  label: string;
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
  busy?: boolean;
  busyLabel?: string;
};

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

export function LiveCamera({ label, onCapture, onClose, busy, busyLabel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        // stop old
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setReady(true);
        }
      } catch (e: any) {
        setErr(e?.message || "Camera unavailable");
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  function capture() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const size = Math.min(v.videoWidth, v.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (v.videoWidth - size) / 2;
    const sy = (v.videoHeight - size) / 2;
    ctx.drawImage(v, sx, sy, size, size, 0, 0, 1024, 1024);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onCapture(dataUrl);
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    const url = await fileToDataUrl(f);
    onCapture(url);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* dim overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 pt-14">
        <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-black/60 backdrop-blur">
          <X className="h-5 w-5 text-white" />
        </button>
        <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-emerald" />
          <span className="text-xs font-semibold text-white">{label}</span>
        </div>
        <button
          onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
          className="grid h-10 w-10 place-items-center rounded-full bg-black/60 backdrop-blur"
        >
          <RotateCcw className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* scan frame */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="relative h-72 w-72">
          <div className="absolute -inset-0.5 rounded-3xl border-2 border-emerald/70 shadow-[0_0_60px_rgba(74,222,128,0.35)]" />
          {/* corner accents */}
          {["top-0 left-0 border-t-4 border-l-4 rounded-tl-3xl",
            "top-0 right-0 border-t-4 border-r-4 rounded-tr-3xl",
            "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl",
            "bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl",
          ].map((c) => (
            <div key={c} className={`absolute h-8 w-8 border-emerald ${c}`} />
          ))}
          {busy && (
            <motion.div
              animate={{ y: [0, 280, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-x-3 h-1 bg-gradient-to-r from-transparent via-emerald to-transparent shadow-[0_0_20px_rgba(74,222,128,0.9)]"
            />
          )}
          {busy && (
            <div className="absolute inset-0 grid place-items-center rounded-3xl bg-black/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-emerald" />
                <span className="text-xs text-white/90">{busyLabel || "Analyzing…"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {err && (
        <div className="absolute inset-x-6 top-32 z-10 rounded-2xl bg-destructive/25 p-3 text-center text-sm text-white">
          {err}
        </div>
      )}

      {/* bottom controls */}
      <div className="absolute inset-x-0 bottom-0 z-10 pb-10 pt-6">
        <div className="mx-auto flex max-w-md items-center justify-between px-8">
          <button
            onClick={() => galRef.current?.click()}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/15 backdrop-blur"
          >
            <ImageIcon className="h-5 w-5 text-white" />
          </button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            disabled={!ready || busy}
            onClick={capture}
            className="grid h-20 w-20 place-items-center rounded-full border-4 border-white/50 disabled:opacity-50"
          >
            <div className="h-14 w-14 rounded-full bg-white" />
          </motion.button>
          <div className="h-11 w-11" />
        </div>
      </div>

      <input
        ref={galRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </div>
  );
}
