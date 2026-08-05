import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { applyLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { i18n } = useTranslation();

  // Keep the whole app in the language stored on the user's account.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("language")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      const lang = (data as { language?: string } | null)?.language;
      if (!cancelled && lang && lang !== i18n.resolvedLanguage) {
        applyLanguage(lang);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [i18n]);

  return <Outlet />;
}
