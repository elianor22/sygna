import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sun,
  Moon,
  Signature,
  ImagePlus,
  Mail,
  FileText,
  GitBranch,
  Sparkles,
} from "lucide-react";

function ThemeToggle() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const [dark, setDark] = useState(isDark);

  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("sygna-theme", next);
    setDark(!dark);
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded transition-colors hover:bg-black/10"
      style={{ color: "var(--color-text-secondary)" }}
      aria-label="Toggle theme"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

const FEATURES = [
  {
    to: "/sign-pdf",
    icon: Signature,
    title: "Sign PDF",
    desc: "Upload a PDF, add signatures, text & shapes, export instantly.",
  },
  {
    to: "/image-to-pdf",
    icon: ImagePlus,
    title: "Image to PDF",
    desc: "Convert PNG or JPEG images into a ready-to-download PDF.",
  },
  {
    to: "/email-generator",
    icon: Mail,
    title: "Email Generator",
    desc: "Pick a tone, add your points, get a ready-to-send email.",
  },
  {
    to: "/md-viewer",
    icon: FileText,
    title: "MD Viewer",
    desc: "Render markdown files with syntax highlighting & split view.",
  },
  {
    to: "/flowchart",
    icon: GitBranch,
    title: "Flowchart",
    desc: "Build flowcharts with standard shapes and export to PNG.",
  },
];

function FeatureCard({ to, icon: Icon, title, desc }: (typeof FEATURES)[number]) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-4 p-6 rounded-lg border transition-colors"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-surface)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
    >
      <div
        className="flex items-center justify-center w-12 h-12 rounded-md"
        style={{ background: "var(--color-bg)", color: "var(--color-accent)" }}
      >
        <Icon size={22} />
      </div>
      <div>
        <p className="text-lg font-medium" style={{ color: "var(--color-text-primary)" }}>
          {title}
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          {desc}
        </p>
      </div>
    </Link>
  );
}

function ComingSoonCard() {
  return (
    <div
      className="relative flex flex-col gap-4 p-6 rounded-lg border border-dashed overflow-hidden"
      style={{
        borderColor: "var(--color-border)",
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 12%, var(--color-surface)) 0%, var(--color-surface) 60%)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 w-32 h-32 rounded-full blur-2xl"
        style={{ background: "var(--color-accent)", opacity: 0.18 }}
      />
      <div
        className="flex items-center justify-center w-12 h-12 rounded-md"
        style={{
          background:
            "linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 60%, transparent))",
          color: "#fff",
        }}
      >
        <Sparkles size={22} />
      </div>
      <div>
        <p className="text-lg font-medium" style={{ color: "var(--color-text-primary)" }}>
          More on the way
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          New tools are cooking — check back soon.
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div
      className="flex flex-col"
      style={{ background: "var(--color-bg)", minHeight: "100vh" }}
    >
      <header
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <span
          className="font-flourish text-2xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          Sygna
        </span>
        <ThemeToggle />
      </header>

      <div className="flex-1 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1
              className="text-3xl sm:text-4xl font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              What do you want to do?
            </h1>
            <p
              className="mt-2 text-sm sm:text-base"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Pick a tool to get started.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <FeatureCard key={f.to} {...f} />
            ))}
            <ComingSoonCard />
          </div>
        </div>
      </div>
    </div>
  );
}
