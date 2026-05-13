"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X, LayoutDashboard, Bot, BookOpen, Trophy, LogOut, ChevronDown, User, Trash2 } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { createClient } from "@/utils/supabase/client";

const navLinks = [
  { name: "Kursus", href: "/courses" },
  { name: "Alur Belajar", href: "/paths" },
  { name: "Papan Skor", href: "/leaderboard" },
  { name: "Kontak", href: "/contact" },
];

const dashboardLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Kursus", href: "/courses", icon: BookOpen },
  { name: "Papan Skor", href: "/leaderboard", icon: Trophy },
];

type Profile = {
  full_name: string | null;
  username: string | null;
  role: string;
};

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, username, role")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setUserDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useGSAP(() => {
    if (isOpen) {
      gsap.to(menuRef.current, {
        x: 0,
        duration: 0.8,
        ease: "power4.inOut",
      });
      gsap.fromTo(
        linkRefs.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.4,
        }
      );
    } else {
      gsap.to(menuRef.current, {
        x: "100%",
        duration: 0.8,
        ease: "power4.inOut",
      });
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Akun ini akan dihapus permanen beserta seluruh data profil. Lanjutkan?");
    if (!confirmed) return;

    setDeletingAccount(true);
    try {
      const response = await fetch("/api/account/delete", { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Gagal menghapus akun.");
      }

      await handleSignOut();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus akun.";
      alert(message);
      setDeletingAccount(false);
    }
  };

  const isLoggedIn = !loading && profile !== null;
  const displayName = profile?.full_name || profile?.username || "Pengguna";

  return (
    <>
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 w-full z-50 py-3 px-6 md:px-8 flex justify-between items-center">
        {/* Background: solid dark when logged in, blend when not */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            isLoggedIn
              ? "bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/10"
              : "bg-transparent mix-blend-difference"
          }`}
        />

        {/* Logo */}
        <Link
          href="/"
          className={`relative font-heading text-xl md:text-2xl font-bold tracking-wider hover:text-accent transition-colors ${
            isLoggedIn ? "text-white" : "text-white mix-blend-difference"
          }`}
        >
          NETVORA<span className="text-accent">.</span>
        </Link>

        {/* Right side */}
        <div className="relative flex items-center gap-3 md:gap-4">
          {loading ? (
            /* skeleton */
            <div className="w-24 h-8 bg-white/10 animate-pulse rounded-full" />
          ) : isLoggedIn ? (
            /* ===== LOGGED-IN NAVBAR ===== */
            <>
              {/* Dashboard quick links (desktop only) */}
              <div className="hidden md:flex items-center gap-1">
                {dashboardLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  >
                    <link.icon className="w-3.5 h-3.5" />
                    {link.name}
                  </Link>
                ))}
              </div>

              {/* User dropdown */}
              <div ref={dropRef} className="relative">
                <button
                  onClick={() => setUserDropOpen((v) => !v)}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-full transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <span className="hidden sm:block text-white text-xs font-medium max-w-[100px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-white/50 transition-transform duration-200 ${userDropOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown panel */}
                {userDropOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[#141414] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-[200]">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-white font-medium text-sm truncate">{displayName}</p>
                      <p className="text-white/40 text-xs uppercase tracking-widest mt-0.5">
                        {profile?.role === "admin"
                          ? "Administrator"
                          : profile?.role === "teacher"
                          ? "Pengajar"
                          : "Siswa"}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-accent" />
                        Dashboard
                      </Link>
                      {(profile?.role === "admin" || profile?.role === "teacher") && (
                        <Link
                          href="/dashboard/management"
                          onClick={() => setUserDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Trophy className="w-4 h-4 text-accent" />
                          Manajemen
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-white/10 py-1">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deletingAccount ? "Menghapus..." : "Hapus Akun"}
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setIsOpen(true)}
                className="md:hidden p-1.5 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <Menu className="w-5 h-5" />
              </button>
            </>
          ) : (
            /* ===== GUEST NAVBAR ===== */
            <>
              <Link
                href="/login"
                className="hidden md:block relative text-xs md:text-sm uppercase tracking-widest font-medium text-white hover:text-accent transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/signup"
                className="hidden md:block relative px-5 py-2 bg-accent text-white text-xs font-bold uppercase tracking-widest hover:bg-accent/80 transition-colors"
              >
                Daftar Gratis
              </Link>
              <button
                onClick={() => setIsOpen(true)}
                className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <Menu className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ===== FULLSCREEN MENU ===== */}
      <div
        ref={menuRef}
        className="fixed inset-0 bg-background/97 backdrop-blur-md z-[100] translate-x-full flex flex-col justify-center px-6 md:px-16 lg:px-24"
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 md:top-8 md:right-8 p-1.5 md:p-2 hover:bg-white/10 rounded-full transition-colors text-white"
        >
          <X className="w-6 h-6 md:w-7 md:h-7" />
        </button>

        <div className="flex flex-col gap-4 md:gap-6 max-w-3xl">
          {(isLoggedIn ? dashboardLinks : navLinks).map((link, i) => (
            <Link
              key={link.name}
              href={link.href}
              ref={(el) => {
                linkRefs.current[i] = el;
              }}
              onClick={() => setIsOpen(false)}
              className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold uppercase hover:text-accent transition-colors w-fit"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="absolute bottom-8 left-6 md:bottom-12 md:left-16 lg:left-24 flex items-center gap-6">
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="text-sm md:text-base text-red-400 hover:text-red-300 uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deletingAccount ? "Menghapus..." : "Hapus Akun"}
              </button>
              <button
                onClick={handleSignOut}
                className="text-sm md:text-base text-red-400 hover:text-red-300 uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="text-sm md:text-base text-white/70 hover:text-white uppercase tracking-widest transition-colors border-b border-accent pb-1"
              >
                Masuk {" ->"}
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsOpen(false)}
                className="text-sm md:text-base text-accent hover:text-white uppercase tracking-widest transition-colors"
              >
                Daftar Gratis
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
