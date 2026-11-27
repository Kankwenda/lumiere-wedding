import { createFileRoute } from "@tanstack/react-router";

/**
 * Sert les photos de couples depuis le stockage privé.
 * URL persistante : /api/public/photos/<chemin-du-fichier>
 * Le bucket reste privé — seule cette route expose les images,
 * avec un cache long car chaque upload génère un nouveau chemin.
 */
export const Route = createFileRoute("/api/public/photos/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat ?? "";
        if (!path || path.includes("..") || path.startsWith("/")) {
          return new Response("Not found", { status: 404 });
        }
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data, error } = await supabaseAdmin.storage
          .from("couple-photos")
          .download(path);
        if (error || !data) {
          return new Response("Not found", { status: 404 });
        }
        return new Response(data, {
          headers: {
            "Content-Type": data.type || "image/jpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
