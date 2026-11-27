import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, QrCode } from "lucide-react";

interface QRCodeCardProps {
  url: string;
  guestName: string;
}

export function QRCodeCard({ url, guestName }: QRCodeCardProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: "#3d2e5c", light: "#ffffff" },
    }).then((png) => {
      if (!cancelled) setDataUrl(png);
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `invitation-${guestName.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  };

  return (
    <div
      className="rounded-3xl p-8 text-center backdrop-blur-md sm:p-10"
      style={{ background: "var(--inv-surface)", border: "1px solid var(--inv-surface-border)" }}
    >
      <div className="flex items-center justify-center gap-2.5">
        <QrCode className="h-5 w-5" style={{ color: "var(--inv-accent)" }} aria-hidden />
        <h3
          className="font-serif text-2xl font-medium sm:text-3xl"
          style={{ color: "var(--inv-text)", fontFamily: "var(--inv-serif)" }}
        >
          Votre invitation personnelle
        </h3>
      </div>
      <p className="mt-2 text-sm" style={{ color: "var(--inv-text-soft)" }}>
        Présentez ce QR code à l'entrée de la cérémonie.
      </p>

      <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-4 shadow-md">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR code de l'invitation de ${guestName}`}
            className="h-44 w-44 sm:h-52 sm:w-52"
          />
        ) : (
          <div className="h-44 w-44 animate-pulse rounded-xl sm:h-52 sm:w-52" style={{ background: "var(--inv-bg)" }} />
        )}
      </div>

      <button
        type="button"
        onClick={download}
        disabled={!dataUrl}
        className="mt-6 inline-flex items-center justify-center gap-2 inv-btn px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        style={{
          background: "transparent",
          color: "var(--inv-primary)",
          border: "1.5px solid var(--inv-primary)",
        }}
      >
        <Download className="h-4 w-4" />
        Télécharger mon QR Code
      </button>
    </div>
  );
}
