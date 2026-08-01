import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Mail, Loader2, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { LangSwitcher } from "@/components/lang-switcher";

export const Route = createFileRoute("/auth")({
  component: Auth,
  head: () => ({
    meta: [
      { title: "Create your account — Neura AI" },
      { name: "description", content: "Create your Neura AI account and start a wellness plan built around your goals." },
      { property: "og:title", content: "Create your account — Neura AI" },
      { property: "og:description", content: "Create your Neura AI account and start a wellness plan built around your goals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Auth() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const [mode, setMode] = useState<"choice" | "email" | "signin">("choice");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function oauth(provider: "google" | "apple") {
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/locale` },
      });
      if (error) throw error;
    } catch (e: any) {
      setErr(e?.message || t("auth.errorGeneric"));
      setLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      if (mode === "email") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/locale`, data: { name } },
        });
        if (error) throw error;
        if (!data.session) {
          setConfirm(true);
          return;
        }
        await supabase
          .from("profiles")
          .update({ name: name || null, language: i18n.resolvedLanguage || "en-US" })
          .eq("user_id", data.user!.id);
        nav({ to: "/locale" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/dashboard" });
      }
    } catch (e: any) {
      setErr(e?.message || t("auth.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute -top-40 left-1/2 h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-emerald/20 blur-[120px]"
        />
        <div className="absolute bottom-0 -right-20 h-[340px] w-[340px] rounded-full bg-hydration/15 blur-[110px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-14">
        <div className="flex items-center justify-between">
          {mode === "choice" ? (
            <Link to="/" className="grid h-10 w-10 place-items-center rounded-full bg-white/8">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={() => {
                setMode("choice");
                setErr(null);
              }}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/8"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <LangSwitcher />
        </div>

        <div className="mt-12 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald to-emerald/60 shadow-emerald-glow">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Neura AI</span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 font-display text-3xl font-bold leading-tight tracking-tight"
        >
          {mode === "signin" ? t("auth.welcome") : t("ob.auth.title")}
        </motion.h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("ob.auth.sub")}</p>

        {confirm ? (
          <div className="glass-strong mt-8 rounded-[28px] p-6 text-center">
            <div className="text-3xl">📬</div>
            <p className="mt-3 text-sm">{t("auth.checkEmail")}</p>
          </div>
        ) : mode === "choice" ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-9 space-y-3"
          >
            <button
              onClick={() => oauth("google")}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-[22px] bg-white py-4 text-[15px] font-semibold text-black disabled:opacity-60"
            >
              <GoogleMark /> {t("ob.auth.google")}
            </button>
            <button
              onClick={() => oauth("apple")}
              disabled={loading}
              className="glass-strong flex w-full items-center justify-center gap-3 rounded-[22px] py-4 text-[15px] font-semibold disabled:opacity-60"
            >
              <AppleMark /> {t("ob.auth.apple")}
            </button>
            <button
              onClick={() => setMode("email")}
              className="flex w-full items-center justify-center gap-3 rounded-[22px] border border-white/10 py-4 text-[15px] font-semibold"
            >
              <Mail className="h-4 w-4" /> {t("ob.auth.email")}
            </button>
          </motion.div>
        ) : (
          <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={submit} className="mt-8 space-y-3">
            {mode === "email" && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("common.name")}
                className="glass w-full rounded-2xl px-4 py-4 text-sm outline-none placeholder:text-muted-foreground"
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="glass w-full rounded-2xl px-4 py-4 text-sm outline-none placeholder:text-muted-foreground"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="glass w-full rounded-2xl px-4 py-4 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              disabled={loading}
              className="w-full rounded-[22px] bg-white py-4 text-[15px] font-semibold text-black disabled:opacity-60"
            >
              {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : t("ob.continue")}
            </button>
          </motion.form>
        )}

        {err && <div className="mt-4 rounded-2xl bg-destructive/20 p-3 text-center text-xs">{err}</div>}

        <div className="mt-auto pt-8 text-center">
          <button
            onClick={() => {
              setMode(mode === "signin" ? "choice" : "signin");
              setErr(null);
            }}
            className="text-xs text-muted-foreground"
          >
            {mode === "signin" ? t("ob.auth.title") : `${t("ob.auth.have")} `}
            <span className="font-semibold text-emerald">
              {mode === "signin" ? "" : t("ob.auth.signin")}
            </span>
          </button>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/70">{t("ob.auth.terms")}</p>
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6z" />
      <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 21.4 7.6 24 12 24z" />
      <path fill="#FBBC05" d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6l3.8-3z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.6 0 3.7 2.6 1.8 6.1l3.8 3C6.5 6.7 9 4.8 12 4.8z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M16.4 12.7c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.6-1.9-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.3.8 2.2-1.2 3.1-2.5c1-1.4 1.4-2.8 1.4-2.9-.1 0-2.8-1.1-2.8-4.3zM14 4.6c.7-.8 1.1-2 1-3.2-1 .1-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3.1 1.1.1 2.2-.6 2.9-1.4z" />
    </svg>
  );
}
