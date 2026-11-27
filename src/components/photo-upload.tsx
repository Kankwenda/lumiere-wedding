import { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { ImagePlus, Loader2, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface PhotoUploadProps {
  invitationId: string;
  photoUrl: string | null;
  onChange: (url: string | null) => void;
}

async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Chargement de l'image impossible"));
    image.src = src;
  });
  const size = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    size,
    size,
  );
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Découpage impossible"))),
      "image/jpeg",
      0.88,
    ),
  );
}

export function PhotoUpload({ invitationId, photoUrl, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedArea(pixels);
  }, []);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choisissez un fichier image");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRawSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const confirmCrop = async () => {
    if (!rawSrc || !croppedArea) return;
    setBusy(true);
    try {
      const blob = await cropToBlob(rawSrc, croppedArea);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expirée");
      const path = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("couple-photos")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const url = `/api/public/photos/${path}`;
      const { error: dbErr } = await supabase
        .from("invitations")
        .update({ couple_photo_url: url })
        .eq("id", invitationId);
      if (dbErr) throw dbErr;
      onChange(url);
      setRawSrc(null);
      toast.success("Photo mise à jour");
    } catch (err) {
      toast.error("Envoi impossible", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async () => {
    if (!photoUrl) return;
    setBusy(true);
    try {
      const path = photoUrl.replace("/api/public/photos/", "");
      await supabase.storage.from("couple-photos").remove([path]);
      const { error } = await supabase
        .from("invitations")
        .update({ couple_photo_url: null })
        .eq("id", invitationId);
      if (error) throw error;
      onChange(null);
      toast.success("Photo supprimée");
    } catch (err) {
      toast.error("Suppression impossible", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-5">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="Photo du couple"
            className="h-28 w-28 rounded-full border-2 border-gold/60 object-cover shadow-soft"
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-border bg-secondary text-muted-foreground">
            <ImagePlus className="h-6 w-6" strokeWidth={1.5} />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : photoUrl ? <RefreshCw className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
            {photoUrl ? "Remplacer" : "Ajouter une photo"}
          </Button>
          {photoUrl && (
            <Button
              type="button"
              variant="ghost"
              className="rounded-full text-destructive hover:text-destructive"
              disabled={busy}
              onClick={removePhoto}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={pickFile}
      />

      <Dialog open={!!rawSrc} onOpenChange={(open) => !open && setRawSrc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Cadrer la photo</DialogTitle>
          </DialogHeader>
          <div className="relative h-80 w-full overflow-hidden rounded-2xl bg-foreground/5">
            {rawSrc && (
              <Cropper
                image={rawSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="px-1 pt-2">
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.05}
              onValueChange={([v]) => v !== undefined && setZoom(v)}
              aria-label="Zoom"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setRawSrc(null)}>
              Annuler
            </Button>
            <Button className="rounded-full" disabled={busy} onClick={confirmCrop}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer la photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
