"use client";
import { useEffect, useMemo, useState } from "react";
import evaluation from "./data/model-evaluation.json";
import ocrEvaluation from "./data/ocr-evaluation.json";
import readiness from "./data/readiness.json";
import {
  cacheIncidents,
  createLocalReference,
  getAnalystDraft,
  listCachedIncidents,
  listOfflineReports,
  queueOfflineReport,
  saveAnalystDraft,
  syncOfflineReports,
  type OfflineReport,
} from "./lib/offline-queue";
import { recogniseEvidence } from "./lib/local-ocr";
type Severity = "Critical" | "High" | "Medium" | "Low" | "Informational";
type Incident = {
  id: string;
  title: string;
  category: string;
  severity: Severity;
  confidence: number;
  department: string;
  asset: string;
  status: string;
  related: number;
  time: string;
  language: string;
  description: string;
  redacted: string;
  indicators: string[];
  explanation?: string;
  assignedAnalyst?: string | null;
  slaDueAt?: string | null;
  closedAt?: string | null;
  closureSummary?: string | null;
};
type StoredIncident = {
  id: string;
  title: string;
  category: string;
  severity: string;
  confidence: number;
  department: string;
  affectedSystem: string;
  status: string;
  relatedCount: number;
  createdAt: string;
  language: string;
  description: string;
  redactedDescription: string;
  indicatorsJson: string;
  duplicateOf: string | null;
  redactionStatus: string;
  analysisExplanation: string;
  assignedAnalyst: string | null;
  slaDueAt: string | null;
  closedAt: string | null;
  closureSummary: string | null;
};
type AuditEntry = {
  id: number;
  incidentId: string | null;
  actorEmail: string;
  action: string;
  previousValue: string | null;
  newValue: string | null;
  reason: string | null;
  connectionState: string;
  createdAt: string;
};
type RoutingDecision = {
  id: number;
  incidentId: string;
  destination: string;
  reason: string;
  fieldsShared: string;
  status: string;
  approvedBy: string | null;
  createdAt: string;
};
type Attachment = {
  id: string;
  incidentId: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  processingStatus: string;
  ocrText?: string | null;
  ocrConfidence?: number | null;
  ocrPageCount?: number | null;
  ocrIndicatorsJson?: string;
  detectedPiiCount: number;
  createdAt: string;
};
type Notice = {
  id: number;
  incidentId: string | null;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};
type LiveMetrics = {
  awaitingReview: number;
  criticalOpen: number;
  reportsToday: number;
  duplicateCount: number;
  overdue: number;
  assignedToMe: number;
  averageMinutes: number;
};
type WorkspaceUser = {
  email: string;
  displayName: string;
  role: string;
  status: string;
  createdAt: string;
};
type RoutingRule = {
  id: string;
  name: string;
  category: string;
  minimumSeverity: string;
  destination: string;
  endpointId: string | null;
  enabled: boolean;
  createdAt: string;
};
type IntegrationEndpoint = {
  id: string;
  name: string;
  type: string;
  endpointUrl: string | null;
  enabled: boolean;
  status: string;
  createdAt: string;
};
type Delivery = {
  id: string;
  incidentId: string;
  destination: string;
  status: string;
  attempts: number;
  lastError: string | null;
  nextAttemptAt: string | null;
  responseCode: number | null;
  deliveredAt: string | null;
  signatureAlgorithm: string | null;
  createdAt: string;
};
type ProviderStatus = {
  type: string;
  configured: boolean;
  destination: string;
  capability: string;
};
type IntegrationRun = {
  id: string;
  providerType: string;
  operation: string;
  status: string;
  responseCode: number | null;
  detail: string | null;
  durationMs: number | null;
  createdAt: string;
};
const incidents: Incident[] = [
  {
    id: "TNG-2026-04874",
    title: "Ransom note found on Bursary desktop",
    category: "Ransomware",
    severity: "Critical",
    confidence: 95,
    department: "Bursary",
    asset: "BUR-PC-07",
    status: "New",
    related: 0,
    time: "8 min ago",
    language: "English",
    description:
      "Staff arrived this morning and found a ransom note demanding payment. Files on the shared drive were renamed.",
    redacted:
      "[STAFF MEMBER] found a ransom note demanding payment. Files on the shared drive were renamed.",
    indicators: ["decryptor-pay[.]top", "SHA256 9f2c…a41b"],
  },
  {
    id: "TNG-2026-04872",
    title: "OTP wey I no request come my phone",
    category: "Account Takeover",
    severity: "Critical",
    confidence: 74,
    department: "Registry",
    asset: "Staff mobile",
    status: "In review",
    related: 0,
    time: "14 min ago",
    language: "Pidgin",
    description:
      "I get OTP for my phone but I no login anywhere. E happen twice today.",
    redacted:
      "I get OTP for [PHONE REDACTED] but I no login anywhere. E happen twice today.",
    indicators: ["+234 80•• ••• 219"],
  },
  {
    id: "TNG-2026-04876",
    title: "Unauthorised access on student records",
    category: "Unauthorised Access",
    severity: "Critical",
    confidence: 79,
    department: "ICT",
    asset: "SRS-DB-01",
    status: "New",
    related: 1,
    time: "22 min ago",
    language: "English",
    description:
      "System log shows an after-hours admin login from an unrecognised device.",
    redacted:
      "System log shows an after-hours admin login from an unrecognised device.",
    indicators: ["197.210.x.x", "adm••••@srs.local"],
  },
  {
    id: "TNG-2026-04871",
    title: "Payroll portal asked for password twice",
    category: "Phishing",
    severity: "High",
    confidence: 88,
    department: "Finance",
    asset: "Payroll portal",
    status: "New",
    related: 2,
    time: "31 min ago",
    language: "English",
    description:
      "The payroll page asked me to re-enter my password immediately after login.",
    redacted:
      "The payroll page asked [REPORTER] to re-enter a password immediately after login.",
    indicators: ["payroll-ng-verify[.]com"],
  },
  {
    id: "TNG-2026-04873",
    title: "Suspicious scholarship link in WhatsApp group",
    category: "Phishing",
    severity: "Medium",
    confidence: 81,
    department: "Student Affairs",
    asset: "WhatsApp",
    status: "In review",
    related: 5,
    time: "1 hr ago",
    language: "English",
    description:
      "A fake scholarship link asks students to verify with portal credentials.",
    redacted:
      "A fake scholarship link asks students to verify with portal credentials.",
    indicators: ["ng-scholar-verify[.]net"],
  },
  {
    id: "TNG-2026-04875",
    title: "Lost staff laptop after conference",
    category: "Device Loss",
    severity: "Medium",
    confidence: 90,
    department: "VC Office",
    asset: "Dell Latitude #22",
    status: "Escalated",
    related: 0,
    time: "2 hrs ago",
    language: "English",
    description:
      "A laptop was misplaced during return travel. Disk encryption is enabled.",
    redacted:
      "A laptop was misplaced during return travel. Disk encryption is enabled.",
    indicators: [],
  },
  {
    id: "TNG-2026-04877",
    title: "Printer issue mentioning virus",
    category: "Benign / Technical",
    severity: "Informational",
    confidence: 63,
    department: "Administration",
    asset: "HP LaserJet",
    status: "Closed",
    related: 0,
    time: "3 hrs ago",
    language: "English",
    description:
      "Printer is not connecting; the word virus appeared only in the email subject.",
    redacted:
      "Printer is not connecting; the word virus appeared only in the email subject.",
    indicators: [],
  },
];
const navGroups = [
  {
    label: "Operations",
    items: [
      "Overview",
      "Incident Queue",
      "Submit Report",
      "Offline Queue",
      "Incident Clusters",
    ],
  },
  {
    label: "Intelligence",
    items: ["Analytics", "Judge Mode", "Management Reports"],
  },
  {
    label: "Response",
    items: ["Routing Centre", "Integration Centre", "Notifications"],
  },
  {
    label: "Administration",
    items: ["Audit Log", "Users & Roles", "Settings", "Help"],
  },
];
const viewRoles: Record<string, readonly string[]> = {
  Overview: ["Reporter", "Analyst", "Senior Analyst", "Administrator", "Auditor"],
  "Incident Queue": ["Reporter", "Analyst", "Senior Analyst", "Administrator", "Auditor"],
  "Incident Detail": ["Reporter", "Analyst", "Senior Analyst", "Administrator", "Auditor"],
  "Submit Report": ["Reporter", "Analyst", "Senior Analyst", "Administrator"],
  "Offline Queue": ["Reporter", "Analyst", "Senior Analyst", "Administrator"],
  "Incident Clusters": ["Analyst", "Senior Analyst", "Administrator", "Auditor"],
  Analytics: ["Analyst", "Senior Analyst", "Administrator", "Auditor"],
  "Judge Mode": ["Analyst", "Senior Analyst", "Administrator", "Auditor"],
  "Management Reports": ["Senior Analyst", "Administrator", "Auditor"],
  "Routing Centre": ["Senior Analyst", "Administrator"],
  "Integration Centre": ["Administrator"],
  Notifications: ["Reporter", "Analyst", "Senior Analyst", "Administrator"],
  "Audit Log": ["Administrator", "Auditor"],
  "Users & Roles": ["Administrator"],
  Settings: ["Administrator"],
  Help: ["Reporter", "Analyst", "Senior Analyst", "Administrator", "Auditor"],
};
function canOpenView(role: string, view: string) {
  return viewRoles[view]?.includes(role) ?? false;
}
const order: Record<Severity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Informational: 4,
};
function storedToIncident(i: StoredIncident): Incident {
  let indicators: string[] = [];
  try {
    indicators = JSON.parse(i.indicatorsJson || "[]");
  } catch {}
  return {
    id: i.id,
    title: i.title,
    category: i.category,
    severity: (["Critical", "High", "Medium", "Low", "Informational"].includes(
      i.severity,
    )
      ? i.severity
      : "Medium") as Severity,
    confidence: i.confidence,
    department: i.department,
    asset: i.affectedSystem,
    status: i.status,
    related: i.relatedCount,
    time: new Date(i.createdAt).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    language: i.language,
    description: i.description,
    redacted: i.redactedDescription || i.description,
    indicators,
    explanation: i.analysisExplanation,
    assignedAnalyst: i.assignedAnalyst,
    slaDueAt: i.slaDueAt,
    closedAt: i.closedAt,
    closureSummary: i.closureSummary,
  };
}
async function updateIncident(
  id: string,
  changes: Record<string, string>,
  reason: string,
) {
  const response = await fetch("/api/incidents", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, ...changes, reason }),
  });
  if (!response.ok)
    throw new Error(
      (await response.json()).error || "Unable to update incident",
    );
  return response.json();
}
async function approveRouting(
  incidentId: string,
  destination: string,
  reason: string,
) {
  const response = await fetch("/api/routing", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      incidentId,
      destination,
      reason,
      fieldsShared: [
        "Incident ID",
        "Category",
        "Severity",
        "Redacted description",
        "Technical indicators",
      ],
    }),
  });
  if (!response.ok)
    throw new Error(
      (await response.json()).error || "Unable to approve routing",
    );
  return response.json();
}
function Icon({ name }: { name: string }) {
  return (
    <span className="navIcon" aria-hidden>
      {name
        .split(" ")
        .map((x) => x[0])
        .join("")
        .slice(0, 2)}
    </span>
  );
}
function Badge({ severity }: { severity: Severity }) {
  return (
    <span className={`badge ${severity.toLowerCase()}`}>
      <i />
      {severity}
    </span>
  );
}
function Confidence({
  value,
  confirmed = false,
}: {
  value: number;
  confirmed?: boolean;
}) {
  return (
    <div
      className={`confidence ${value < 60 ? "uncertain" : ""}`}
      style={{ "--score": `${value * 3.6}deg` } as React.CSSProperties}
    >
      <span>{value}%</span>
      {confirmed && <b>✓</b>}
    </div>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <strong>◇</strong>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function PublicLanding() {
  const signIn = "/signin-with-chatgpt?return_to=%2F";
  return <div className="publicSite">
    <header className="publicNav">
      <a className="brand" href="#home"><span className="brandmark">T247</span><span><b>Triage247Ng</b><small>Independent cyber incident triage</small></span></a>
      <nav aria-label="Public navigation"><a href="#how">How It Works</a><a href="#resources">Cybersecurity Resources</a><a href="#faq">FAQ</a><a href="#about">About</a><a href="#contact">Contact</a></nav>
      <div><a className="outline" href={signIn}>Sign In</a><a className="primary compact" href={signIn}>Create Account</a></div>
    </header>
    <main id="home" className="publicMain">
      <section className="publicLandingHero"><div><span className="portalEyebrow">Track D · Government and Public Sector</span><h1>Report securely. Triage intelligently. Respond faster.</h1><p>Triage247Ng transforms unstructured English, Nigerian Pidgin, screenshots and files into privacy-reduced, classified, deduplicated and prioritised records for authorised human review.</p><div className="heroActions"><a className="primary" href={signIn}>Report an Incident</a><a className="outline" href="#how">See how it works</a></div><small>Formal reports require a verified signed-in account. Anonymous submission is disabled.</small></div><aside><b>Human-controlled by design</b><p>AI recommends category, severity and destination. Analysts confirm, correct or defer every consequential action.</p><span>Offline-capable · Local OCR · Explainable severity</span></aside></section>
      <section className="independenceNotice"><b>Independent platform notice</b><span>Triage247Ng is an independent cyber-incident triage platform. It is not affiliated with or operated by ngCERT, NITDA, NCCC, the Nigeria Police Force or any Nigerian government agency.</span></section>
      <section id="how" className="publicSection"><span className="portalEyebrow">How It Works</span><h2>From messy report to review-ready incident</h2><div className="publicCards"><article><b>1 · Submit securely</b><p>Sign in, accept the privacy terms and describe the event in English or Nigerian Pidgin.</p></article><article><b>2 · Process locally</b><p>OCR, redaction, classification, indicators, severity factors and duplicates are prepared without paid cloud AI.</p></article><article><b>3 · Human decision</b><p>Authorised analysts correct recommendations and approve any onward routing with an audit trail.</p></article></div></section>
      <section id="resources" className="publicSection tinted"><span className="portalEyebrow">Cybersecurity Resources</span><h2>Report safely</h2><div className="publicCards"><article><b>Preserve evidence</b><p>Keep the original message or screenshot. Do not forward suspicious links or open unknown files.</p></article><article><b>Never share secrets</b><p>Do not submit passwords, PINs, one-time codes, private keys or unrelated personal records.</p></article><article><b>Urgent danger</b><p>For immediate danger to life or safety, contact the appropriate emergency service and your institutional security desk.</p></article></div></section>
      <section id="faq" className="publicSection"><span className="portalEyebrow">Frequently Asked Questions</span><h2>What the platform does—and does not do</h2><details><summary>Does AI make the final decision?</summary><p>No. It recommends; authorised people decide.</p></details><details><summary>Can I continue without internet?</summary><p>Yes. The core workflow stores a stable local reference and synchronises safely when connectivity returns.</p></details><details><summary>Is this a government service?</summary><p>No. Triage247Ng is independent and makes no government-affiliation claim.</p></details></section>
      <section id="about" className="publicSection tinted"><span className="portalEyebrow">About</span><h2>Built for small institutional security teams</h2><p>The platform addresses Track D: sorting incident reports nobody has time to read. It is an intake and triage layer, not an autonomous defence system or replacement for any response organisation.</p></section>
      <section id="contact" className="publicSection"><span className="portalEyebrow">Contact</span><h2>Use your institution’s approved security contact</h2><p>Production contact details must be configured by the deploying institution. This demonstration uses synthetic data only.</p><a className="primary" href={signIn}>Create Account or Sign In</a></section>
    </main>
    <footer className="publicFooter"><b>Triage247Ng</b><span>Privacy notice · Reporting terms · Accessibility</span><small>Report securely. Triage intelligently. Respond faster.</small></footer>
  </div>;
}
export default function Home() {
  const [view, setView] = useState("Overview");
  const [selected, setSelected] = useState<Incident | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [connection, setConnection] = useState<
    "Online" | "Offline" | "Syncing"
  >("Online");
  const [pending, setPending] = useState(0);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [localDevelopment, setLocalDevelopment] = useState(false);
  const [accessState, setAccessState] = useState<"checking" | "authenticated" | "public">("checking");
  const [currentRole, setCurrentRole] = useState("Reporter");
  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2400);
  };
  const open = (incident: Incident) => {
    setSelected(incident);
    setView("Incident Detail");
  };
  const refreshPending = () =>
    listOfflineReports()
      .then((rows) => setPending(rows.length))
      .catch(() => setPending(0));
  const runSync = async () => {
    setConnection("Syncing");
    try {
      const result = await syncOfflineReports();
      setPending(result.pending);
      setLastSynced(result.syncedAt);
      setConnection(result.pending ? "Offline" : "Online");
      flash(
        result.synced
          ? `${result.synced} locally saved report${result.synced === 1 ? "" : "s"} synchronised`
          : result.pending
            ? "Synchronisation pending — retry available"
            : "Offline queue is up to date",
      );
    } catch {
      setConnection("Offline");
      await refreshPending();
      flash("Synchronisation failed — reports remain safely stored");
    }
  };
  useEffect(() => {
    // Keep the server render and the browser's first render identical. Browser
    // connectivity is only available after hydration.
    if (!navigator.onLine) {
      queueMicrotask(() => setConnection("Offline"));
    }
    if (["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) {
      queueMicrotask(() => setLocalDevelopment(true));
    }
    refreshPending();
    fetch("/api/users").then(async response => {
      if (!response.ok) return setAccessState("public");
      const data = await response.json() as { currentRole?: string };
      setCurrentRole(data.currentRole || "Reporter");
      setView("Overview");
      setAccessState("authenticated");
    }).catch(() => setAccessState("public"));
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker.register("/sw.js");
    const online = () => {
      void runSync();
    };
    const offline = () => setConnection("Offline");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);
  if (accessState === "checking") return <div className="accessCheck"><b>Triage247Ng</b><span>Checking secure access…</span></div>;
  if (accessState === "public") return <PublicLanding />;
  const cycle = () => {
    if (connection === "Online") setConnection("Offline");
    else void runSync();
  };
  const connectionText =
    connection === "Online"
      ? lastSynced
        ? `Connected · synced ${new Date(lastSynced).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}`
        : "Connected securely"
      : connection === "Offline"
        ? `Offline · ${pending} report${pending === 1 ? "" : "s"} pending`
        : `Syncing ${pending} report${pending === 1 ? "" : "s"}…`;
  return (
    <div className={`app ${sidebarCollapsed ? "sidebarCollapsed" : ""}`}>
      <a className="skipLink" href="#main-content">
        Skip to main content
      </a>
      {localDevelopment && (
        <div className="developmentWarning" role="alert">
          Development mode: local test identity is active. Do not use this mode for production data.
        </div>
      )}
      <div className="institutionStrip">
        <span className="stripNotice">{currentRole === "Administrator" ? "Protected administration portal" : `${currentRole} workspace`}</span>
        <span className="stripTagline">Report securely. Triage intelligently. Respond faster.</span>
        <button onClick={() => setView("Help")}>Help &amp; guidance</button>
      </div>
      <div className={`connect ${connection.toLowerCase()}`}>
        <span>{connectionText}</span>
      </div>
      <header>
        <button
          className="menuToggle"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          aria-controls="workspace-navigation"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span aria-hidden>☰</span>
        </button>
        <button className="brand" onClick={() => setView("Overview")}> 
          <span className="brandmark">TN</span>
          <span>
            <b>Triage247Ng</b>
            <small>Cyber incident operations</small>
          </span>
        </button>
        <label className="search">
          ⌕
          <input
            aria-label="Global search"
            placeholder="Search incidents, IDs or indicators…"
          />
          <kbd>⌘ K</kbd>
        </label>
        <div className="headerActions">
          <button className="connectionButton" onClick={cycle}>
            ● {connection}
            {pending ? ` · ${pending} pending` : ""}
          </button>
          <button
            className="iconButton"
            aria-label="Notifications"
            onClick={() => setView("Notifications")}
          >
            ♢<i>3</i>
          </button>
          <button
            className="primary compact"
            onClick={() => setView("Submit Report")}
          >
            ＋ New report
          </button>
          <button className="avatar" aria-label="Open profile for Nneka Adeyemi">NA</button>
        </div>
      </header>
      <div className="body">
        {mobileOpen && (
          <button
            className="navScrim"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <aside id="workspace-navigation" className={mobileOpen ? "mobileOpen" : ""}>
          <div className="org">
            <span>AB</span>
            <div>
              <b>ABU Security Operations</b>
              <small>Institution workspace</small>
            </div>
            <button
              className="collapseNav"
              aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            >
              {sidebarCollapsed ? "›" : "‹"}
            </button>
          </div>
          <nav aria-label="Workspace navigation">
            {navGroups.map((group) => {
              const visibleItems = group.items.filter((name) => canOpenView(currentRole, name));
              if (!visibleItems.length) return null;
              return (
              <div className="navGroup" key={group.label}>
                <small>{group.label}</small>
                {visibleItems.map((name) => (
                  <button
                    key={name}
                    title={sidebarCollapsed ? name : undefined}
                    className={
                      view === name ||
                      (view === "Incident Detail" && name === "Incident Queue")
                        ? "active"
                        : ""
                    }
                    onClick={() => {
                      setView(name);
                      setMobileOpen(false);
                    }}
                  >
                    <Icon name={name} />
                    <span>{name}</span>
                    {name === "Incident Queue" && <em>3</em>}
                    {name === "Offline Queue" && pending > 0 && <em>{pending}</em>}
                  </button>
                ))}
              </div>
            );})}
          </nav>
          <div className="disclaimer">
            <b>Independent platform</b>
            <p>Triage247Ng is an independent cyber-incident triage platform. It is not affiliated with or operated by ngCERT, NCCC, NITDA, the Nigeria Police Force or any Nigerian government agency.</p>
          </div>
          <div className="user">
            <span className="avatar">NA</span>
            <div>
              <b>Nneka Adeyemi</b>
              <small>{currentRole}</small>
            </div>
            <button aria-label="Open user menu">⋮</button>
          </div>
        </aside>
        <main id="main-content" tabIndex={-1}>
          {view === "Overview" && <Overview open={open} go={setView} />}{" "}
          {view === "Incident Queue" && <Queue open={open} />}{" "}
          {view === "Incident Detail" && selected && (
            <Detail
              incident={selected}
              back={() => setView("Incident Queue")}
              flash={flash}
            />
          )}{" "}
          {view === "Submit Report" && (
            <Submit
              connection={connection}
              onQueued={refreshPending}
              done={() => {
                flash(
                  connection === "Offline"
                    ? "Report saved locally"
                    : "Report submitted for triage",
                );
                setView("Overview");
              }}
            />
          )}{" "}
          {view === "Offline Queue" && (
            <OfflineQueue connection={connection} onRetry={runSync} />
          )}{" "}
          {view === "Incident Clusters" && <Clusters open={open} />}{" "}
          {view === "Analytics" && <Analytics />}{" "}
          {view === "Judge Mode" && <JudgeMode go={setView} />}{" "}
          {view === "Management Reports" && <ManagementReports flash={flash} />}{" "}
          {view === "Routing Centre" && canOpenView(currentRole, view) && <Routing flash={flash} />}{" "}
          {view === "Integration Centre" && canOpenView(currentRole, view) && <IntegrationCentre flash={flash} />}{" "}
          {view === "Notifications" && <Notifications flash={flash} />}{" "}
          {view === "Audit Log" && canOpenView(currentRole, view) && <Audit />}{" "}
          {view === "Users & Roles" && currentRole === "Administrator" && <Users />}{" "}
          {view === "Settings" && currentRole === "Administrator" && <Settings flash={flash} />}{" "}
          {view === "Help" && <Help go={() => setView("Submit Report")} />}
          <footer className="siteFooter">
            <div>
              <span className="footerMark">TN</span>
              <p><b>Triage247Ng</b><br />Intelligent Cyber Incident Triage and Routing Platform</p>
            </div>
            <div>
              <b>Operate safely</b>
              <button onClick={() => setView("Submit Report")}>Report an incident</button>
              <button onClick={() => setView("Help")}>Help and privacy</button>
            </div>
            <div>
              <b>Service</b>
              <span>{connectionText}</span>
              <button onClick={() => setView("Settings")}>Accessibility settings</button>
            </div>
            <p className="footerDisclaimer">Triage247Ng is an independent cyber-incident triage platform. It is not affiliated with or operated by ngCERT, NCCC, NITDA, the Nigeria Police Force or any Nigerian government agency.</p>
            <small>Responsible use only · Version 0.3.0</small>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
function PageHead({
  eyebrow,
  title,
  desc,
  action,
}: {
  eyebrow?: string;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="pageHead">
      <div>
        {eyebrow && <small>{eyebrow}</small>}
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {action}
    </div>
  );
}
function Overview({
  open,
  go,
}: {
  open: (i: Incident) => void;
  go: (s: string) => void;
}) {
  const critical = incidents.filter((i) => i.severity === "Critical"),
    [live, setLive] = useState<LiveMetrics | null>(null);
  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setLive(d.metrics))
      .catch(() => {});
  }, []);
  const metricCards = live
    ? [
        [
          "Awaiting review",
          String(live.awaitingReview),
          `${live.assignedToMe} assigned to you`,
        ],
        ["Critical open", String(live.criticalOpen), `${live.overdue} overdue`],
        ["Reports today", String(live.reportsToday), "Live records"],
        [
          "Duplicates grouped",
          String(live.duplicateCount),
          "Similarity detection",
        ],
        ["Avg. triage time", `${live.averageMinutes}m`, "Completed incidents"],
      ]
    : [
        ["Awaiting review", "7", "↑ 2 today"],
        ["Critical open", "3", "1 overdue"],
        ["Reports today", "12", "↑ 18%"],
        ["Duplicates grouped", "6", "Saved 42 min"],
        ["Avg. triage time", "18m", "↓ 4 min"],
      ];
  return (
    <div className="page">
      <PageHead
        eyebrow="Friday, 22 August 2026"
        title="Good evening, Nneka"
        desc="Here is what needs your attention right now."
        action={
          <button className="primary" onClick={() => go("Submit Report")}>
            ＋ Submit report
          </button>
        }
      />
      <div className="quickActions" aria-label="Quick actions">
        <button onClick={() => go("Incident Queue")}><span aria-hidden>01</span><b>Review incident queue</b><small>Prioritise critical and overdue reports</small></button>
        <button onClick={() => go("Submit Report")}><span aria-hidden>02</span><b>Submit a report</b><small>English and Nigerian Pidgin supported</small></button>
        <button onClick={() => go("Offline Queue")}><span aria-hidden>03</span><b>Check offline queue</b><small>Review pending device-local reports</small></button>
      </div>
      <section className="alert">
        <span>!</span>
        <div>
          <b>3 critical incidents require review</b>
          <p>
            One incident has been waiting longer than the 15-minute response
            target.
          </p>
        </div>
        <button onClick={() => go("Incident Queue")}>Review now →</button>
      </section>
      <div className="metrics">
        {metricCards.map((x) => (
          <article key={x[0]}>
            <small>{x[0]}</small>
            <strong>{x[1]}</strong>
            <span>{x[2]}</span>
          </article>
        ))}
      </div>
      <div className="gridTwo">
        <section className="panel">
          <div className="panelHead">
            <div>
              <h2>Critical incidents</h2>
              <p>Ordered by operational urgency</p>
            </div>
            <button className="link" onClick={() => go("Incident Queue")}>
              View full queue →
            </button>
          </div>
          {critical.map((i) => (
            <IncidentRow key={i.id} i={i} open={open} />
          ))}
        </section>
        <section className="panel">
          <div className="panelHead">
            <div>
              <h2>Incident trend</h2>
              <p>Reports received over 7 days</p>
            </div>
            <span className="trendUp">+18%</span>
          </div>
          <div className="chart">
            {[32, 48, 40, 68, 55, 82, 70].map((h, i) => (
              <div key={i} className="bar" style={{ height: `${h}%` }}>
                <span>{[5, 8, 6, 11, 9, 14, 12][i]}</span>
                <small>
                  {["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"][i]}
                </small>
              </div>
            ))}
          </div>
          <div className="legend">
            <span>
              <i className="criticalBg" />
              Critical 25%
            </span>
            <span>
              <i className="highBg" />
              High 33%
            </span>
            <span>
              <i className="mediumBg" />
              Medium 42%
            </span>
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="panelHead">
          <div>
            <h2>Analyst workload</h2>
            <p>Current assignments and response status</p>
          </div>
        </div>
        <div className="workload">
          {[
            ["NA", "Nneka Adeyemi", 4, 72],
            ["IB", "Ibrahim Bello", 3, 55],
            ["CO", "Chiamaka Okafor", 2, 38],
          ].map((x) => (
            <div key={String(x[1])}>
              <span className="avatar">{x[0]}</span>
              <div>
                <b>{x[1]}</b>
                <small>{x[2]} active incidents</small>
              </div>
              <div className="progress">
                <i style={{ width: `${x[3]}%` }} />
              </div>
              <button>View</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
function IncidentRow({
  i,
  open,
}: {
  i: Incident;
  open: (i: Incident) => void;
}) {
  return (
    <button className="incidentRow" onClick={() => open(i)}>
      <Badge severity={i.severity} />
      <div className="incidentTitle">
        <b>{i.title}</b>
        <small>
          <code>{i.id}</code> · {i.department} · {i.time}
        </small>
      </div>
      {i.related > 0 && <span className="related">⊙ {i.related} related</span>}
      <Confidence value={i.confidence} />
      <span className="chev">›</span>
    </button>
  );
}
function Queue({ open }: { open: (i: Incident) => void }) {
  const [filter, setFilter] = useState("All"),
    [query, setQuery] = useState(""),
    [saved, setSaved] = useState<Incident[]>([]);
  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/incidents");
        if (!response.ok) throw new Error("Live queue unavailable");
        const data = await response.json();
        await cacheIncidents(data.incidents);
        setSaved(data.incidents.map(storedToIncident));
      } catch {
        const cached = await listCachedIncidents<StoredIncident>();
        setSaved(cached.map(storedToIncident));
      }
    };
    void load();
  }, []);
  const all = useMemo(
    () => [
      ...saved,
      ...incidents.filter((i) => !saved.some((s) => s.id === i.id)),
    ],
    [saved],
  );
  const rows = useMemo(
    () =>
      all
        .filter(
          (i) =>
            (filter === "All" || i.severity === filter) &&
            (i.title + i.id + i.category)
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) => order[a.severity] - order[b.severity]),
    [all, filter, query],
  );
  return (
    <div className="page">
      <PageHead
        title="Incident Queue"
        desc="Prioritised reports awaiting analyst review."
        action={<button className="primary">Assign selected</button>}
      />
      <div className="toolbar">
        <label className="tableSearch">
          ⌕
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search queue…"
          />
        </label>
        <div className="filters">
          {["All", "Critical", "High", "Medium", "Informational"].map((f) => (
            <button
              key={f}
              className={filter === f ? "on" : ""}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <button className="outline">⇩ Export</button>
      </div>
      <section className="panel tablePanel">
        <table>
          <thead>
            <tr>
              <th>Incident</th>
              <th>Severity</th>
              <th>Category</th>
              <th>AI confidence</th>
              <th>Related</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id} onClick={() => open(i)}>
                <td>
                  <b>{i.title}</b>
                  <small>
                    <code>{i.id}</code> · {i.department} · {i.time}
                  </small>
                </td>
                <td>
                  <Badge severity={i.severity} />
                </td>
                <td>{i.category}</td>
                <td>
                  <div className="confidenceCell">
                    <Confidence value={i.confidence} />
                    <span>
                      {i.confidence >= 80 ? "High confidence" : "Needs review"}
                    </span>
                  </div>
                </td>
                <td>{i.related || "—"}</td>
                <td>
                  <span className="status">{i.status}</span>
                </td>
                <td>›</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <Empty
            title="No matching reports"
            text="Clear the filters or try a different search."
          />
        )}
      </section>
    </div>
  );
}
function Detail({
  incident,
  back,
  flash,
}: {
  incident: Incident;
  back: () => void;
  flash: (s: string) => void;
}) {
  const [openedAt] = useState(() => Date.now());
  const [original, setOriginal] = useState(false),
    [severity, setSeverity] = useState<Severity>(incident.severity),
    [category, setCategory] = useState(incident.category),
    [modal, setModal] = useState(false),
    [confirmed, setConfirmed] = useState(false),
    [note, setNote] = useState(""),
    [saving, setSaving] = useState(false),
    [reviewed, setReviewed] = useState(false),
    [files, setFiles] = useState<Attachment[]>([]),
    [redacted, setRedacted] = useState(incident.redacted),
    [privacyApproved, setPrivacyApproved] = useState(false);
  useEffect(() => {
    fetch(`/api/attachments?incidentId=${encodeURIComponent(incident.id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setFiles(d.attachments))
      .catch(() => {});
  }, [incident.id]);
  useEffect(() => {
    void getAnalystDraft(incident.id).then((draft) => {
      if (draft) setNote(draft);
    });
  }, [incident.id]);
  return (
    <div className="page">
      <button className="back" onClick={back}>
        ← Back to queue
      </button>
      <PageHead
        eyebrow={incident.id}
        title={incident.title}
        desc={`${incident.department} · ${incident.asset} · Submitted ${incident.time}`}
        action={
          <div className="headBadges">
            <Badge severity={severity} />
            <span className="status">{incident.status}</span>
          </div>
        }
      />
      <div className="detailGrid">
        <div className="detailMain">
          <section className="panel reportPanel">
            <div className="sectionLabel">REPORT INFORMATION</div>
            <div className="metaGrid">
              {[
                ["Language", incident.language],
                ["Affected system", incident.asset],
                ["Department", incident.department],
                ["Received", incident.time],
              ].map((x) => (
                <div key={x[0]}>
                  <small>{x[0]}</small>
                  <b>{x[1]}</b>
                </div>
              ))}
            </div>
            {(incident.assignedAnalyst || incident.slaDueAt) && (
              <div className="privacyNotice">
                Assigned to {incident.assignedAnalyst || "Unassigned"}
                {incident.slaDueAt
                  ? ` · SLA ${new Date(incident.slaDueAt).getTime() < openedAt ? "overdue" : "due"} ${new Date(incident.slaDueAt).toLocaleString("en-NG")}`
                  : ""}
              </div>
            )}
            <hr />
            <h3>Original report</h3>
            <p className="reportText">{incident.description}</p>
            {files.length ? (
              files.map((f) => (
                <div className="ocrEvidence" key={f.id}>
                  <div className="attachment">
                    ▧
                    <div>
                      <b>{f.originalName}</b>
                      <small>
                        {(f.sizeBytes / 1024).toFixed(0)} KB ·{" "}
                        {f.processingStatus}
                      </small>
                    </div>
                    <span className="status">
                      {f.ocrConfidence != null
                        ? `${Math.round(f.ocrConfidence)}% OCR${f.ocrPageCount ? ` · ${f.ocrPageCount}p` : ""}`
                        : "Secured"}
                    </span>
                  </div>
                  {f.ocrText && (
                    <div className="ocrReview">
                      <div className="sectionLabel">
                        PRIVACY-REDUCED OCR TEXT · HUMAN REVIEW REQUIRED
                      </div>
                      <p>{f.ocrText}</p>
                      <small>
                        {f.detectedPiiCount} possible personal-data item
                        {f.detectedPiiCount === 1 ? "" : "s"} masked.
                      </small>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="attachment">
                ▧
                <div>
                  <b>No uploaded evidence</b>
                  <small>
                    PNG, JPG, PDF and TXT files are supported during report
                    submission.
                  </small>
                </div>
              </div>
            )}
          </section>
          <section className="panel aiPanel analysisPanel">
            <div className="sectionLabel cyanText">
              AI ANALYSIS · REQUIRES HUMAN REVIEW
            </div>
            <div className="aiSummary">
              <Confidence value={incident.confidence} confirmed={confirmed} />
              <div>
                <h3>
                  {incident.confidence >= 80
                    ? "High-confidence recommendation"
                    : "Analyst review recommended"}
                </h3>
                <p>
                  {incident.explanation || (
                    <>
                      The report language and indicators are most consistent
                      with <b>{category}</b>. No automatic action has been
                      taken.
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="evidence">
              <small>Evidence considered</small>
              <span>Unexpected authentication behaviour</span>
              <span>Suspicious indicator pattern</span>
              <span>{incident.language} language model</span>
            </div>
            <div className="formRow">
              <label>
                Recommended category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>{incident.category}</option>
                  <option>Phishing</option>
                  <option>Account Takeover</option>
                  <option>Malware</option>
                  <option>Benign / Technical</option>
                </select>
              </label>
              <label>
                Severity
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Severity)}
                >
                  {["Critical", "High", "Medium", "Low", "Informational"].map(
                    (x) => (
                      <option key={x}>{x}</option>
                    ),
                  )}
                </select>
              </label>
            </div>
            <button
              disabled={saving || note.trim().length < 10}
              className="secondary"
              onClick={async () => {
                setSaving(true);
                try {
                  await updateIncident(
                    incident.id,
                    { category, severity, status: "In Review" },
                    note,
                  );
                  setConfirmed(true);
                  flash("Recommendation confirmed and audit entry saved");
                } catch (e) {
                  flash(e instanceof Error ? e.message : "Update failed");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving decision…" : "✓ Confirm recommendation"}
            </button>
          </section>
          <section className="panel indicatorsPanel">
            <div className="sectionLabel">TECHNICAL INDICATORS</div>
            {incident.indicators.length ? (
              <div className="indicators">
                {incident.indicators.map((x) => (
                  <button key={x} onClick={() => flash("Indicator copied")}>
                    {x}
                    <span>Copy</span>
                  </button>
                ))}
              </div>
            ) : (
              <Empty
                title="No indicators extracted"
                text="The report contains no recognisable technical indicators."
              />
            )}
          </section>
        </div>
        <div className="detailSide">
          <section className="panel privacy privacyPanel">
            <div className="sectionLabel">PRIVACY PANEL</div>
            <div className="privacyNotice">
              ◉ Personal information reduced · automated detection requires
              human review
            </div>
            <h3>{original ? "Original report" : "Redacted preview"}</h3>
            {original ? (
              <p>{incident.description}</p>
            ) : (
              <textarea
                value={redacted}
                onChange={(e) => {
                  setRedacted(e.target.value);
                  setPrivacyApproved(false);
                }}
                rows={7}
                aria-label="Editable redacted description"
              />
            )}
            <button
              className="outline full"
              disabled={saving || (!original && note.trim().length < 10)}
              onClick={async () => {
                if (original) {
                  setOriginal(false);
                  return;
                }
                setSaving(true);
                try {
                  await updateIncident(
                    incident.id,
                    { originalRevealed: "true" },
                    note,
                  );
                  setOriginal(true);
                  flash("Original report revealed and access logged");
                } catch (error) {
                  flash(
                    error instanceof Error
                      ? error.message
                      : "Original report could not be revealed",
                  );
                } finally {
                  setSaving(false);
                }
              }}
            >
              {original
                ? "Hide original"
                : note.trim().length < 10
                  ? "Add reason below to reveal original"
                  : "Reveal original — access will be logged"}
            </button>
            {!original && (
              <button
                disabled={saving || privacyApproved}
                className="secondary full"
                onClick={async () => {
                  setSaving(true);
                  try {
                    await updateIncident(
                      incident.id,
                      {
                        redactedDescription: redacted,
                        redactionStatus: "Approved",
                      },
                      "Analyst reviewed and approved privacy redaction",
                    );
                    setPrivacyApproved(true);
                    flash("Privacy redaction approved and logged");
                  } catch (e) {
                    flash(
                      e instanceof Error
                        ? e.message
                        : "Privacy approval failed",
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {privacyApproved
                  ? "✓ Redaction approved"
                  : "Approve redacted version"}
              </button>
            )}
            <small>
              Automated redaction reduces exposure but may not detect every
              identifier.
            </small>
          </section>
          <section className="panel actions actionsPanel">
            <div className="sectionLabel">ANALYST ACTIONS</div>
            <label>
              Analyst note
              <textarea
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  void saveAnalystDraft(incident.id, e.target.value);
                }}
                placeholder="Saved locally as you type · minimum 10 characters…"
              />
            </label>
            <button
              disabled={saving}
              className="secondary full"
              onClick={async () => {
                setSaving(true);
                try {
                  await updateIncident(
                    incident.id,
                    { assignedAnalyst: "self", status: "In Review" },
                    "Analyst accepted incident assignment",
                  );
                  flash("Incident assigned to you with SLA target");
                } catch (e) {
                  flash(e instanceof Error ? e.message : "Assignment failed");
                } finally {
                  setSaving(false);
                }
              }}
            >
              Assign to me
            </button>
            <button className="primary full" onClick={() => setModal(true)}>
              Approve routing
            </button>
            <button
              className="outline full"
              onClick={() => flash("Incident escalated")}
            >
              ↑ Escalate
            </button>
            <button
              className="outline full"
              onClick={() => flash("Additional information requested")}
            >
              Request information
            </button>
            <button
              className="dangerLink"
              onClick={() => flash("Marked as false positive")}
            >
              Mark false positive
            </button>
            {incident.status === "Closed" ? (
              <button
                disabled={saving || note.trim().length < 10}
                className="outline full"
                onClick={async () => {
                  setSaving(true);
                  try {
                    await updateIncident(
                      incident.id,
                      { status: "In Review" },
                      note,
                    );
                    flash("Incident reopened and audit entry saved");
                  } catch (e) {
                    flash(e instanceof Error ? e.message : "Reopen failed");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Reopen incident
              </button>
            ) : (
              <button
                disabled={saving || note.trim().length < 10}
                className="secondary full"
                onClick={async () => {
                  setSaving(true);
                  try {
                    await updateIncident(
                      incident.id,
                      { status: "Closed", closureSummary: note },
                      note,
                    );
                    flash("Incident closed with resolution summary");
                  } catch (e) {
                    flash(e instanceof Error ? e.message : "Closure failed");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Close incident
              </button>
            )}
          </section>
        </div>
      </div>
      {modal && (
        <div className="modalWrap">
          <div className="modal">
            <button className="modalClose" onClick={() => setModal(false)}>
              ×
            </button>
            <small>HUMAN APPROVAL REQUIRED</small>
            <h2>Approve incident routing</h2>
            <p>
              This prepares a standardised, redacted record. It does not imply
              automatic government integration.
            </p>
            <div className="routeCard">
              <span>IS</span>
              <div>
                <b>Internal ICT/Security Team</b>
                <small>
                  Recommended because this affects an institutional system.
                </small>
              </div>
            </div>
            <div className="shareList">
              <b>Information to be shared</b>
              <p>
                Incident ID, category, severity, redacted description and
                technical indicators.
              </p>
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
              />{" "}
              I have reviewed the redacted preview.
            </label>
            <div className="modalButtons">
              <button className="outline" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button
                disabled={!reviewed || note.trim().length < 10 || saving}
                className="primary"
                onClick={async () => {
                  setSaving(true);
                  try {
                    await approveRouting(
                      incident.id,
                      "Internal ICT/Security Team",
                      note,
                    );
                    setModal(false);
                    flash("Routing approval stored securely");
                  } catch (e) {
                    flash(e instanceof Error ? e.message : "Routing failed");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving approval…" : "Confirm approval"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
async function persistIncident(title: string, description: string) {
  const response = await fetch("/api/incidents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title,
      description,
      department: "Unspecified",
      affectedSystem: "Unspecified",
      language: "English",
    }),
  });
  if (!response.ok) throw new Error("Unable to store incident");
  return response.json();
}
async function persistEvidence(incidentId: string, file: File) {
  const form = new FormData();
  form.set("incidentId", incidentId);
  form.set("file", file);
  const response = await fetch("/api/attachments", {
    method: "POST",
    body: form,
  });
  if (!response.ok)
    throw new Error(
      (await response.json()).error || "Unable to store evidence",
    );
  return response.json();
}
async function persistOcr(
  attachmentId: string,
  text: string,
  confidence: number,
  pageCount: number,
  engine: string,
) {
  const response = await fetch("/api/attachments", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ attachmentId, text, confidence, pageCount, engine }),
  });
  if (!response.ok)
    throw new Error(
      (await response.json()).error || "Unable to save OCR result",
    );
  return response.json();
}
function Submit({
  connection,
  done,
  onQueued,
}: {
  connection: string;
  done: () => void;
  onQueued: () => void;
}) {
  const [step, setStep] = useState(1),
    [consent, setConsent] = useState(false),
    [title, setTitle] = useState(""),
    [desc, setDesc] = useState(""),
    [saving, setSaving] = useState(false),
    [saveError, setSaveError] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [reference, setReference] = useState("TNG-2026-DURABLE"),
    [savedLocally, setSavedLocally] = useState(false),
    [ocrProgress, setOcrProgress] = useState<number | null>(null),
    [ocrStatus, setOcrStatus] = useState(""),
    [ocrSummary, setOcrSummary] = useState("");
  const saveOffline = async () => {
    const localReference = createLocalReference();
    await queueOfflineReport({
      localReference,
      createdAt: new Date().toISOString(),
      title,
      description: desc,
      file: file || undefined,
      fileName: file?.name,
      fileType: file?.type,
    });
    setReference(localReference);
    setSavedLocally(true);
    onQueued();
    setStep(3);
  };
  if (step === 3)
    return (
      <div className="page narrow publicReport confirmationPage">
        <section className="panel confirmation">
          <div className="successMark">✓</div>
          <h1>{savedLocally ? "Report saved locally" : "Report received"}</h1>
          <p>Your stable reference number is</p>
          <code>{reference}</code>
          <div className="confirmationNote">
            {savedLocally
              ? "Saved locally — will submit when connection returns. The original timestamp and reference will be retained."
              : "The report is stored securely for analyst review. No external routing occurs without approval."}
          </div>
          <button className="primary full" onClick={done}>
            Return to overview
          </button>
        </section>
      </div>
    );
  return (
    <div className="page narrow publicReport">
      <section className="publicHero" aria-labelledby="report-portal-title">
        <div>
          <span className="portalEyebrow">Secure public reporting portal</span>
          <h1 id="report-portal-title">Report a cyber incident with confidence</h1>
          <p>Share what you observed in English or Nigerian Pidgin. Triage247Ng reduces personal information and prepares the report for human review.</p>
        </div>
        <div className="systemAssurance">
          <span aria-hidden>●</span>
          <div><b>Reporting service available</b><small>{connection === "Offline" ? "Offline saving is active on this device" : "Encrypted connection · analyst review enabled"}</small></div>
        </div>
      </section>
      <div className="independenceNotice" role="note">
        <b>Independent platform notice</b>
        <span>Triage247Ng is an independent cyber-incident triage platform. It is not affiliated with or operated by ngCERT, NCCC, NITDA, the Nigeria Police Force or any Nigerian government agency.</span>
      </div>
      <PageHead
        title="Submit an incident report"
        desc="Tell us what you noticed. English or Nigerian Pidgin is fine."
      />
      <div className="steps">
        <span className={step >= 1 ? "on" : ""}>
          1<b>Describe</b>
        </span>
        <i />
        <span className={step >= 2 ? "on" : ""}>
          2<b>Review</b>
        </span>
        <i />
        <span>
          3<b>Done</b>
        </span>
      </div>
      <section className="panel submitForm">
        {step === 1 ? (
          <>
            <label>
              Report title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Unexpected password request"
              />
              <small>Use a short description of what you noticed.</small>
            </label>
            <label>
              What happened?
              <textarea
                value={desc}
                onChange={(event) => setDesc(event.target.value)}
                rows={6}
                placeholder="Describe what happened, when it happened and which system was affected."
              />
              <small>{desc.length}/20 minimum characters</small>
            </label>
            <div className="formRow">
              <label>
                Affected system
                <input placeholder="Payroll portal, email, laptop…" />
              </label>
              <label>
                Department
                <select>
                  <option>Select department</option>
                  <option>Bursary</option>
                  <option>Registry</option>
                  <option>ICT</option>
                </select>
              </label>
            </div>
            <label>
              Screenshot or file
              <span className="drop">
                ⇧<b>{file ? file.name : "Choose evidence file"}</b>
                <small>
                  {file
                    ? `${(file.size / 1024 / 1024).toFixed(2)} MB · ready for secure storage`
                    : "PNG, JPG, PDF or TXT · Maximum 10 MB"}
                </small>
                <input
                  aria-label="Choose evidence file"
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf,.txt"
                  style={{ display: "none" }}
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
              </span>
            </label>
            <button
              disabled={title.length < 8 || desc.length < 20}
              className="primary full"
              onClick={() => setStep(2)}
            >
              Continue to review →
            </button>
          </>
        ) : (
          <>
            <div className="reviewBox">
              <small>REPORT TITLE</small>
              <b>{title}</b>
              <small>DESCRIPTION</small>
              <p>{desc}</p>
            </div>
            <div className="privacyNotice">
              ◉ Personal information will be reduced and every recommendation
              requires human review.
            </div>
            {connection === "Offline" && (
              <div className="confirmationNote">
                Offline: this report and its evidence will be stored on this
                device with a stable reference.
              </div>
            )}
            {file && (
              <div className="attachment">
                ▧
                <div>
                  <b>{file.name}</b>
                  <small>
                    {connection === "Offline"
                      ? "Device-local browser storage · upload pending"
                      : ocrProgress !== null
                        ? `${ocrStatus || "Local OCR processing"} · ${ocrProgress}%`
                        : ocrSummary ||
                          (file.type.startsWith("image/") ||
                          file.type === "application/pdf"
                            ? "Secure upload ready · device-local OCR (PDF: first 5 pages)"
                            : "Secure upload ready")}
                  </small>
                </div>
                <span className="status">
                  {ocrProgress !== null ? "Processing" : "Ready"}
                </span>
              </div>
            )}
            {saveError && <div className="formError">{saveError}</div>}
            <label className="check">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />{" "}
              I understand this report will be reviewed by my institution’s
              security team.
            </label>
            <div className="modalButtons">
              <button className="outline" onClick={() => setStep(1)}>
                ← Edit report
              </button>
              <button
                disabled={!consent || saving}
                className="primary"
                onClick={async () => {
                  setSaving(true);
                  setSaveError("");
                  try {
                    if (connection === "Offline") await saveOffline();
                    else {
                      try {
                        const saved = await persistIncident(title, desc);
                        setReference(saved.incident.id);
                        if (file) {
                          const stored = await persistEvidence(
                            saved.incident.id,
                            file,
                          );
                          if (
                            file.type.startsWith("image/") ||
                            file.type === "application/pdf"
                          ) {
                            try {
                              setOcrProgress(0);
                              const ocr = await recogniseEvidence(
                                file,
                                (update) => {
                                  setOcrProgress(update.progress);
                                  setOcrStatus(update.label);
                                },
                              );
                              await persistOcr(
                                stored.attachment.id,
                                ocr.text,
                                ocr.confidence,
                                ocr.pageCount,
                                ocr.engine,
                              );
                              setOcrSummary(
                                `${ocr.engine} complete · ${ocr.pageCount} page${ocr.pageCount === 1 ? "" : "s"} · ${ocr.confidence}% confidence · analyst review required`,
                              );
                            } catch (ocrError) {
                              setOcrSummary(
                                ocrError instanceof Error
                                  ? `OCR needs review: ${ocrError.message}`
                                  : "OCR could not be completed",
                              );
                            } finally {
                              setOcrProgress(null);
                              setOcrStatus("");
                            }
                          }
                        }
                        setStep(3);
                      } catch {
                        await saveOffline();
                      }
                    }
                  } catch (error) {
                    setSaveError(
                      error instanceof Error
                        ? error.message
                        : "The report could not be stored. Please retry.",
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving
                  ? "Saving securely…"
                  : connection === "Offline"
                    ? "Save locally"
                    : "Submit for triage"}
              </button>
            </div>
          </>
        )}
      </section>
      <section className="reportGuidance" aria-label="Reporting guidance">
        <article><span aria-hidden>01</span><b>What happens next</b><p>An analyst reviews the report, confirms the classification and decides whether routing is appropriate.</p></article>
        <article><span aria-hidden>02</span><b>Privacy by design</b><p>Contact details and identifiers are masked before sharing. Original text requires explicit permission to reveal.</p></article>
        <article><span aria-hidden>03</span><b>Need urgent help?</b><p>If there is immediate danger to life or safety, contact the appropriate emergency service. Do not rely on this portal for emergencies.</p></article>
      </section>
    </div>
  );
}

function OfflineQueue({
  connection,
  onRetry,
}: {
  connection: string;
  onRetry: () => Promise<void>;
}) {
  const [reports, setReports] = useState<OfflineReport[]>([]),
    [loading, setLoading] = useState(true);
  const load = () =>
    listOfflineReports()
      .then(setReports)
      .finally(() => setLoading(false));
  useEffect(() => {
    void load();
  }, []);
  return (
    <div className="page">
      <PageHead
        title="Offline Queue"
        desc="Reports retained on this device until synchronisation succeeds."
        action={
          <button
            className="primary"
            disabled={connection === "Offline" || !reports.length}
            onClick={async () => {
              await onRetry();
              await load();
            }}
          >
            Retry synchronisation
          </button>
        }
      />
      <div className="privacyNotice">
        External routing is never queued automatically. After synchronisation, a
        Senior Analyst or Administrator must review the current redacted record
        and approve routing again.
      </div>
      <section className="panel tablePanel">
        {loading ? (
          <div className="empty">
            <p>Loading device-local reports…</p>
          </div>
        ) : reports.length ? (
          <table>
            <thead>
              <tr>
                <th>Local reference</th>
                <th>Report</th>
                <th>Saved</th>
                <th>Evidence</th>
                <th>Attempts</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.localReference}>
                  <td>
                    <code>{report.localReference}</code>
                  </td>
                  <td>
                    <b>{report.title}</b>
                    <small>{report.description.slice(0, 90)}</small>
                  </td>
                  <td>{new Date(report.createdAt).toLocaleString("en-NG")}</td>
                  <td>{report.fileName || "None"}</td>
                  <td>{report.attempts}</td>
                  <td>
                    <span className="status">
                      {report.lastError
                        ? "Sync failed — pending"
                        : "Saved locally"}
                    </span>
                    {report.lastError && <small>{report.lastError}</small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty
            title="No reports waiting"
            text="All locally saved reports have been synchronised."
          />
        )}
      </section>
    </div>
  );
}
function Clusters({ open }: { open: (i: Incident) => void }) {
  const cs = [
    {
      name: "Scholarship credential-harvesting campaign",
      count: 6,
      score: 92,
      sev: "High" as Severity,
      indicator: "ng-scholar-verify[.]net",
      items: [incidents[4], incidents[3]],
    },
    {
      name: "Student records unusual access",
      count: 2,
      score: 84,
      sev: "Critical" as Severity,
      indicator: "197.210.x.x",
      items: [incidents[2]],
    },
  ];
  return (
    <div className="page">
      <PageHead
        title="Incident Clusters"
        desc="Related reports grouped by language similarity and shared indicators."
      />
      <div className="clusterGrid">
        {cs.map((c) => (
          <section className="panel cluster" key={c.name}>
            <div className="clusterTop">
              <Badge severity={c.sev} />
              <Confidence value={c.score} />
            </div>
            <h2>{c.name}</h2>
            <p>
              {c.count} related reports · Shared indicator{" "}
              <code>{c.indicator}</code>
            </p>
            <div className="clusterTimeline">
              {c.items.map((i) => (
                <button key={i.id} onClick={() => open(i)}>
                  <span />
                  <div>
                    <b>{i.title}</b>
                    <small>
                      {i.id} · {i.time}
                    </small>
                  </div>
                  ›
                </button>
              ))}
            </div>
            <div className="clusterButtons">
              <button className="secondary">Review cluster</button>
              <button className="outline">Split reports</button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
function Analytics() {
  const languages = Object.entries(evaluation.byLanguage);
  const classes = Object.entries(evaluation.overall.perClass);
  const pipeline = evaluation.pipeline;
  const headline = [
    ["Labelled reports", evaluation.dataset.total, "Synthetic answer key"],
    ["Held-out test", evaluation.dataset.test, "Never used for training"],
    [
      "Category accuracy",
      `${(evaluation.overall.accuracy * 100).toFixed(1)}%`,
      "Measured",
    ],
    [
      "Critical recall",
      `${(pipeline.severity.criticalRecall * 100).toFixed(1)}%`,
      `${pipeline.severity.urgentMissed.length} urgent missed`,
    ],
    ["Mean runtime", `${pipeline.runtime.meanMsPerReport}ms`, "Per report"],
  ];
  const pipelineScores = [
    ["Severity accuracy", pipeline.severity.accuracy],
    ["Routing accuracy", pipeline.routing.accuracy],
    ["Indicator F1", pipeline.indicators.f1],
    ["Redaction recall", pipeline.redaction.recall],
    ["Duplicate F1", pipeline.duplicates.f1],
  ];
  return (
    <div className="page">
      <PageHead
        title="End-to-End Evaluation"
        desc="Reproducible Python evaluation of every major Track D output."
        action={
          <div className="clusterButtons">
            <a className="outline" href="/api/evaluation?type=dataset">
              Download answer key
            </a>
            <a className="outline" href="/api/evaluation?type=evaluation">
              Download evaluation
            </a>
          </div>
        }
      />
      <div className="privacyNotice">
        These results use {evaluation.dataset.total} synthetic reports and small
        diagnostic sets, including deliberately ambiguous cases. They
        demonstrate the evaluation method and do not claim production
        performance.
      </div>
      <div className="metrics">
        {headline.map((x) => (
          <article key={String(x[0])}>
            <small>{x[0]}</small>
            <strong>{x[1]}</strong>
            <span>{x[2]}</span>
          </article>
        ))}
      </div>
      <section className="panel">
        <div className="panelHead">
          <div>
            <h2>Full-pipeline scorecard</h2>
            <p>
              Measured separately so strong classification cannot hide
              weaknesses elsewhere
            </p>
          </div>
          <span className="status">
            Python pipeline · seed {evaluation.dataset.seed}
          </span>
        </div>
        <div className="metrics">
          {pipelineScores.map(([name, score]) => (
            <article key={String(name)}>
              <small>{name}</small>
              <strong>{(Number(score) * 100).toFixed(1)}%</strong>
              <span>Diagnostic benchmark</span>
            </article>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panelHead">
          <div>
            <h2>Measured OCR benchmark</h2>
            <p>
              Synthetic English and Nigerian Pidgin screenshots evaluated by the
              Python benchmark
            </p>
          </div>
          <div className="clusterButtons">
            <a className="outline" href="/api/evaluation?type=ocr-dataset">
              OCR answer key
            </a>
            <a className="outline" href="/api/evaluation?type=ocr">
              OCR evaluation
            </a>
          </div>
        </div>
        <div className="metrics">
          <article>
            <small>Benchmark cases</small>
            <strong>{ocrEvaluation.method.cases}</strong>
            <span>Synthetic, reproducible</span>
          </article>
          <article>
            <small>Character accuracy</small>
            <strong>
              {(ocrEvaluation.overall.characterAccuracy * 100).toFixed(1)}%
            </strong>
            <span>Across all text</span>
          </article>
          <article>
            <small>Word accuracy</small>
            <strong>
              {(ocrEvaluation.overall.wordAccuracy * 100).toFixed(1)}%
            </strong>
            <span>English + Pidgin</span>
          </article>
          <article>
            <small>Privacy recall after OCR</small>
            <strong>
              {(ocrEvaluation.overall.privacyRecallAfterOcr * 100).toFixed(1)}%
            </strong>
            <span>
              {ocrEvaluation.overall.privacyDetected}/
              {ocrEvaluation.overall.privacyExpected} test identifiers
            </span>
          </article>
          <article>
            <small>Failure cases shown</small>
            <strong>{ocrEvaluation.failures.length}</strong>
            <span>No errors hidden</span>
          </article>
        </div>
        <div className="privacyNotice">
          Synthetic benchmark only: camera glare, handwriting, damaged documents
          and wider Nigerian Pidgin spelling variation require further field
          testing.
        </div>
      </section>
      <div className="gridTwo">
        <section className="panel">
          <div className="panelHead">
            <div>
              <h2>Performance by category</h2>
              <p>Precision, recall and F1 from the held-out answer key</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1</th>
                <th>Test reports</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(([name, value]) => (
                <tr key={name}>
                  <td>
                    <b>{name}</b>
                  </td>
                  <td>{value.precision.toFixed(3)}</td>
                  <td>{value.recall.toFixed(3)}</td>
                  <td>{value.f1.toFixed(3)}</td>
                  <td>{value.support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="panel">
          <div className="panelHead">
            <div>
              <h2>Language performance</h2>
              <p>Separated to expose English/Pidgin gaps</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Language</th>
                <th>Reports</th>
                <th>Accuracy</th>
                <th>Macro F1</th>
              </tr>
            </thead>
            <tbody>
              {languages.map(([name, value]) => (
                <tr key={name}>
                  <td>
                    <b>{name}</b>
                  </td>
                  <td>{value.reports}</td>
                  <td>{(value.accuracy * 100).toFixed(1)}%</td>
                  <td>{value.macroF1.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="privacyNotice">
            Language results are descriptive because the synthetic English and
            Pidgin test groups are not equal in size.
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="panelHead">
          <div>
            <h2>Misclassified cases</h2>
            <p>Shown honestly so judges can inspect failure modes</p>
          </div>
          <span className="badge medium">
            <i />
            {evaluation.misclassified.length} examples
          </span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Report</th>
              <th>Language</th>
              <th>Expected</th>
              <th>Predicted</th>
              <th>Text</th>
            </tr>
          </thead>
          <tbody>
            {evaluation.misclassified.slice(0, 6).map((item) => (
              <tr key={item.id}>
                <td>
                  <code>{item.id}</code>
                </td>
                <td>{item.language}</td>
                <td>
                  <b>{item.expected}</b>
                </td>
                <td>{item.predicted}</td>
                <td>{item.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="panel">
        <div className="panelHead">
          <div>
            <h2>Safety and failure analysis</h2>
            <p>Critical misses and privacy limitations</p>
          </div>
        </div>
        <div className="gridTwo">
          <div>
            <div className="sectionLabel">URGENT INCIDENTS</div>
            <p>
              {pipeline.severity.urgentMissed.length
                ? `${pipeline.severity.urgentMissed.length} critical incident(s) were not classified as Critical.`
                : "No critical incidents were missed in this held-out set."}
            </p>
          </div>
          <div>
            <div className="sectionLabel">PRIVACY SAFEGUARD</div>
            <p>
              Redaction recall is {(pipeline.redaction.recall * 100).toFixed(1)}
              %. Original reports remain restricted and external sharing still
              requires human approval.
            </p>
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="sectionLabel">KNOWN LIMITATIONS</div>
        {evaluation.limitations.map((item) => (
          <p key={item}>• {item}</p>
        ))}
      </section>
    </div>
  );
}
function JudgeMode({ go }: { go: (view: string) => void }) {
  const demo = [
    [
      "Open the urgent queue",
      "Show severity ordering, SLA warnings and a Nigerian Pidgin report.",
    ],
    [
      "Review AI evidence",
      "Open an incident and explain category, severity, confidence and supporting indicators.",
    ],
    [
      "Demonstrate privacy control",
      "Compare the original and editable redacted record; approve only after review.",
    ],
    [
      "Show OCR and duplicates",
      "Submit synthetic screenshot/PDF evidence and inspect related-report grouping.",
    ],
    [
      "Prove human routing",
      "Open the routing preview, review shared fields and confirm that approval is compulsory.",
    ],
    [
      "Close with measured results",
      "Show the 712-report evaluation, cluster leakage check, OCR benchmark, errors and limitations.",
    ],
  ];
  return (
    <div className="page">
      <section className="judgeHero">
        <small>2026 UNIVERSITIES HACKATHON · TRACK D</small>
        <h2>Triage247Ng judge demonstration</h2>
        <p>
          Independent, offline-capable incident intake and triage for Nigerian
          institutions. Triage247Ng cleans, redacts, classifies, prioritises,
          groups and prepares unstructured reports for human-approved routing.
        </p>
        <div className="judgeActions">
          <button className="primary" onClick={() => go("Incident Queue")}>
            Start live demonstration
          </button>
          <button className="outline" onClick={() => go("Analytics")}>
            Open measured evaluation
          </button>
          <a className="outline" href="/api/readiness">
            Download readiness record
          </a>
        </div>
      </section>
      <div className="metrics">
        <article>
          <small>Labelled reports</small>
          <strong>{evaluation.dataset.total}</strong>
          <span>Synthetic answer key</span>
        </article>
        <article>
          <small>Category accuracy</small>
          <strong>{(evaluation.overall.accuracy * 100).toFixed(1)}%</strong>
          <span>Held-out test</span>
        </article>
        <article>
          <small>Critical recall</small>
          <strong>100%</strong>
          <span>Diagnostic set</span>
        </article>
        <article>
          <small>OCR word accuracy</small>
          <strong>96.9%</strong>
          <span>20 synthetic cases</span>
        </article>
        <article>
          <small>Routing control</small>
          <strong>Human</strong>
          <span>No silent transmission</span>
        </article>
      </div>
      <div className="judgeGrid">
        <section className="panel">
          <div className="panelHead">
            <div>
              <h2>Track D readiness</h2>
              <p>Requirement mapped to verifiable evidence</p>
            </div>
            <span className="status">
              {readiness.requirements.length}/{readiness.requirements.length}{" "}
              covered
            </span>
          </div>
          {readiness.requirements.map((item) => (
            <div className="complianceRow" key={item.requirement}>
              <b>{item.requirement}</b>
              <span className="status">{item.status}</span>
              <small>{item.evidence}</small>
            </div>
          ))}
        </section>
        <div>
          <section className="panel">
            <div className="panelHead">
              <div>
                <h2>Six-minute demo</h2>
                <p>Recommended judge flow</p>
              </div>
            </div>
            {demo.map((step, index) => (
              <div className="demoStep" key={step[0]}>
                <span>{index + 1}</span>
                <div>
                  <b>{step[0]}</b>
                  <small>{step[1]}</small>
                </div>
              </div>
            ))}
          </section>
          <section className="panel">
            <div className="panelHead">
              <div>
                <h2>Known limitations</h2>
                <p>Stated openly; no production overclaim</p>
              </div>
            </div>
            <ul className="riskList">
              {readiness.limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function ManagementReports({ flash }: { flash: (s: string) => void }) {
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null),
    [running, setRunning] = useState(false);
  const load = () =>
    fetch("/api/metrics")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setMetrics(d.metrics))
      .catch(() => flash("Management metrics could not be loaded"));
  useEffect(() => {
    void load();
  }, []);
  const escalate = async () => {
    setRunning(true);
    try {
      const response = await fetch("/api/escalations", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Escalation failed");
      flash(
        `${data.escalated} overdue incident${data.escalated === 1 ? "" : "s"} escalated`,
      );
      load();
    } catch (e) {
      flash(e instanceof Error ? e.message : "Escalation failed");
    } finally {
      setRunning(false);
    }
  };
  const cards = metrics
    ? [
        ["Awaiting review", metrics.awaitingReview],
        ["Critical open", metrics.criticalOpen],
        ["Overdue SLA", metrics.overdue],
        ["Assigned to me", metrics.assignedToMe],
        ["Duplicates", metrics.duplicateCount],
        ["Average triage", `${metrics.averageMinutes}m`],
      ]
    : [];
  return (
    <div className="page reportPage">
      <PageHead
        title="Management Reports"
        desc="Live operational summary for governance, workload and SLA oversight."
        action={
          <button className="primary" onClick={() => window.print()}>
            Print report
          </button>
        }
      />
      <div className="metrics">
        {cards.map((c) => (
          <article key={String(c[0])}>
            <small>{c[0]}</small>
            <strong>{c[1]}</strong>
            <span>Live database</span>
          </article>
        ))}
      </div>
      <div className="gridTwo">
        <section className="panel">
          <h2>Operational controls</h2>
          <p>
            Escalate every open incident whose severity-based response deadline
            has passed.
          </p>
          <button className="secondary" disabled={running} onClick={escalate}>
            {running ? "Checking deadlines…" : "Run SLA escalation"}
          </button>
        </section>
        <section className="panel">
          <h2>Downloadable records</h2>
          <p>
            Exports respect the signed-in user’s role and include current
            workflow data.
          </p>
          <div className="clusterButtons">
            <a className="outline" href="/api/exports?type=incidents">
              Download incidents CSV
            </a>
            <a className="outline" href="/api/exports?type=audit">
              Download audit CSV
            </a>
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="sectionLabel">MANAGEMENT INTERPRETATION</div>
        <p>
          {metrics
            ? `${metrics.criticalOpen} critical incident(s) remain open, with ${metrics.overdue} currently outside the response target. ${metrics.assignedToMe} active incident(s) are assigned to the signed-in analyst. Average completed triage time is ${metrics.averageMinutes} minutes.`
            : "Loading live interpretation…"}
        </p>
      </section>
    </div>
  );
}
function Routing({ flash }: { flash: (s: string) => void }) {
  const demo = [
    {
      id: "TNG-2026-04874",
      name: "Ransom note found on Bursary desktop",
      to: "Internal ICT/Security Team",
      state: "Pending approval",
      sev: "Critical" as Severity,
    },
    {
      id: "TNG-2026-04873",
      name: "Scholarship phishing campaign",
      to: "Sectoral CSIRT",
      state: "Redaction review",
      sev: "High" as Severity,
    },
    {
      id: "TNG-2026-04875",
      name: "Lost encrypted staff laptop",
      to: "Data Protection Officer",
      state: "Delivered",
      sev: "Medium" as Severity,
    },
  ];
  const [live, setLive] = useState<RoutingDecision[]>([]);
  useEffect(() => {
    fetch("/api/routing")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setLive(d.routingDecisions))
      .catch(() => {});
  }, []);
  const rs = [
    ...live.map((r) => ({
      id: r.incidentId,
      name: "Approved incident routing",
      to: r.destination,
      state: r.status,
      sev: "Medium" as Severity,
    })),
    ...demo,
  ];
  return (
    <div className="page">
      <PageHead
        title="Routing Centre"
        desc="Review, approve and track onward incident handling."
      />
      <div className="routingNotice">
        Triage247Ng recommends destinations but does not transmit externally
        without authorised human approval.
      </div>
      <section className="panel tablePanel">
        <table>
          <thead>
            <tr>
              <th>Incident</th>
              <th>Severity</th>
              <th>Destination</th>
              <th>Information</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rs.map((r) => (
              <tr key={r.id}>
                <td>
                  <b>{r.name}</b>
                  <small>
                    <code>{r.id}</code>
                  </small>
                </td>
                <td>
                  <Badge severity={r.sev} />
                </td>
                <td>{r.to}</td>
                <td>Redacted record + indicators</td>
                <td>
                  <span className="status">{r.state}</span>
                </td>
                <td>
                  <button
                    className="link"
                    onClick={() =>
                      flash(
                        r.state === "Delivered"
                          ? "Delivery record opened"
                          : "Routing review opened",
                      )
                    }
                  >
                    Review →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
function IntegrationCentre({ flash }: { flash: (s: string) => void }) {
  const [endpoints, setEndpoints] = useState<IntegrationEndpoint[]>([]),
    [rules, setRules] = useState<RoutingRule[]>([]),
    [deliveries, setDeliveries] = useState<Delivery[]>([]),
    [providers, setProviders] = useState<ProviderStatus[]>([]),
    [runs, setRuns] = useState<IntegrationRun[]>([]),
    [endpointName, setEndpointName] = useState("Institution Security Webhook"),
    [endpointType, setEndpointType] = useState("Webhook"),
    [endpointUrl, setEndpointUrl] = useState(""),
    [ruleName, setRuleName] = useState("Critical incident internal routing"),
    [destination, setDestination] = useState("Internal ICT/Security Team"),
    [category, setCategory] = useState("Any"),
    [minimumSeverity, setMinimumSeverity] = useState("High"),
    [busy, setBusy] = useState(false);
  const load = () =>
    Promise.all([
      fetch("/api/integrations").then((r) => r.json()),
      fetch("/api/rules").then((r) => r.json()),
      fetch("/api/deliveries").then((r) => r.json()),
      fetch("/api/providers").then((r) => r.json()),
    ])
      .then(([a, b, c, d]) => {
        setEndpoints(a.endpoints || []);
        setRules(b.rules || []);
        setDeliveries(c.deliveries || []);
        setProviders(d.providers || []);
        setRuns(d.runs || []);
      })
      .catch(() => flash("Integration data could not be loaded"));
  useEffect(() => {
    void load();
  }, []);
  const createEndpoint = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: endpointName,
          type: endpointType,
          endpointUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      flash("Integration endpoint registered — credentials still required");
      setEndpointUrl("");
      load();
    } catch (e) {
      flash(e instanceof Error ? e.message : "Endpoint registration failed");
    } finally {
      setBusy(false);
    }
  };
  const createRule = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/rules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: ruleName,
          destination,
          category,
          minimumSeverity,
          endpointId: endpoints[0]?.id || "",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      flash("Routing rule created and audited");
      load();
    } catch (e) {
      flash(e instanceof Error ? e.message : "Rule creation failed");
    } finally {
      setBusy(false);
    }
  };
  const retry = async (id: string) => {
    const response = await fetch("/api/deliveries", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await response.json();
    flash(
      response.ok
        ? "Retry scheduled with controlled backoff"
        : data.error || "Retry failed",
    );
    load();
  };
  const toggleEndpoint = async (endpoint: IntegrationEndpoint) => {
    const response = await fetch("/api/integrations", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: endpoint.id, enabled: !endpoint.enabled }),
    });
    const data = await response.json();
    flash(
      response.ok
        ? `Endpoint ${endpoint.enabled ? "disabled" : "enabled for signed delivery"}`
        : data.error || "Endpoint update failed",
    );
    load();
  };
  const testProvider = async (type: string) => {
    setBusy(true);
    try {
      const response = await fetch("/api/providers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await response.json();
      flash(data.run?.status || data.error || "Provider test completed");
      load();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="page">
      <PageHead
        title="Integration Centre"
        desc="Configure institutional routing and prepare secure external delivery without exposing provider credentials."
      />
      <div className="routingNotice">
        External transmission stays disabled until an HTTPS endpoint and
        server-side credential are validated. Triage247Ng never stores signing
        secrets in these forms.
      </div>
      <section className="panel tablePanel">
        <div className="panelHead">
          <div>
            <h2>Production provider readiness</h2>
            <p>
              Server-side credential checks and controlled connectivity tests;
              secrets are never displayed.
            </p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Adapter</th>
              <th>Capability</th>
              <th>Configuration</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.type}>
                <td>
                  <b>{p.type}</b>
                </td>
                <td>{p.capability}</td>
                <td>{p.destination}</td>
                <td>
                  <span className="status">
                    {p.configured ? "Configured" : "Credential required"}
                  </span>
                </td>
                <td>
                  <button
                    className="link"
                    disabled={busy}
                    onClick={() => testProvider(p.type)}
                  >
                    Test safely
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {runs.length > 0 && (
        <section className="panel tablePanel">
          <div className="sectionLabel">RECENT PROVIDER RECEIPTS</div>
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Operation</th>
                <th>Status</th>
                <th>Response</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {runs.slice(0, 8).map((r) => (
                <tr key={r.id}>
                  <td>{r.providerType}</td>
                  <td>{r.operation}</td>
                  <td>
                    <span className="status">{r.status}</span>
                  </td>
                  <td>{r.responseCode ? `HTTP ${r.responseCode}` : "—"}</td>
                  <td>{r.durationMs == null ? "—" : `${r.durationMs} ms`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      <div className="gridTwo">
        <section className="panel settingsForm">
          <h2>Register integration</h2>
          <label>
            Name
            <input
              value={endpointName}
              onChange={(e) => setEndpointName(e.target.value)}
            />
          </label>
          <div className="formRow">
            <label>
              Type
              <select
                value={endpointType}
                onChange={(e) => setEndpointType(e.target.value)}
              >
                {["Webhook", "Email", "OCR", "Threat Intelligence"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              HTTPS endpoint
              <input
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="https://security.example.edu.ng/hooks/incidents"
              />
            </label>
          </div>
          <button
            disabled={busy || !endpointName}
            className="primary"
            onClick={createEndpoint}
          >
            Register endpoint
          </button>
        </section>
        <section className="panel settingsForm">
          <h2>Create routing rule</h2>
          <label>
            Rule name
            <input
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
            />
          </label>
          <div className="formRow">
            <label>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {[
                  "Any",
                  "Phishing",
                  "Account Takeover",
                  "Malware",
                  "Ransomware",
                  "Device Loss",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Minimum severity
              <select
                value={minimumSeverity}
                onChange={(e) => setMinimumSeverity(e.target.value)}
              >
                {["Critical", "High", "Medium", "Low", "Informational"].map(
                  (x) => (
                    <option key={x}>{x}</option>
                  ),
                )}
              </select>
            </label>
          </div>
          <label>
            Destination
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </label>
          <button
            disabled={busy || !ruleName || !destination}
            className="primary"
            onClick={createRule}
          >
            Create rule
          </button>
        </section>
      </div>
      <section className="panel tablePanel">
        <table>
          <thead>
            <tr>
              <th>Configured integration</th>
              <th>Type</th>
              <th>Endpoint</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {endpoints.map((e) => (
              <tr key={e.id}>
                <td>
                  <b>{e.name}</b>
                </td>
                <td>{e.type}</td>
                <td>{e.endpointUrl || "Not supplied"}</td>
                <td>
                  <span className="status">{e.status}</span>
                </td>
                <td>
                  <button className="link" onClick={() => toggleEndpoint(e)}>
                    {e.enabled ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!endpoints.length && (
          <Empty
            title="No integrations registered"
            text="Register an HTTPS provider endpoint when your institution is ready."
          />
        )}
      </section>
      <section className="panel tablePanel">
        <table>
          <thead>
            <tr>
              <th>Delivery queue</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Receipt</th>
              <th>Attempts</th>
              <th>Next attempt</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {deliveries.map((d) => (
              <tr key={d.id}>
                <td>
                  <code>{d.incidentId}</code>
                </td>
                <td>{d.destination}</td>
                <td>
                  <span className="status">{d.status}</span>
                </td>
                <td>
                  {d.responseCode
                    ? `HTTP ${d.responseCode}`
                    : d.signatureAlgorithm || "—"}
                </td>
                <td>{d.attempts}</td>
                <td>
                  {d.nextAttemptAt
                    ? new Date(d.nextAttemptAt).toLocaleString("en-NG")
                    : "—"}
                </td>
                <td>
                  <button className="link" onClick={() => retry(d.id)}>
                    Retry
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!deliveries.length && (
          <Empty
            title="Delivery queue is empty"
            text="Approved routing decisions will create standardised delivery records here."
          />
        )}
      </section>
      <section className="panel">
        <div className="sectionLabel">ACTIVE ROUTING RULES</div>
        {rules.length ? (
          rules.map((r) => (
            <div className="incidentRow" key={r.id}>
              <span className="badge medium">
                <i />
                {r.minimumSeverity}+
              </span>
              <div className="incidentTitle">
                <b>{r.name}</b>
                <small>
                  {r.category} → {r.destination}
                </small>
              </div>
              <span className="status">
                {r.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          ))
        ) : (
          <Empty
            title="No routing rules"
            text="Create a rule to standardise destination recommendations."
          />
        )}
      </section>
    </div>
  );
}
function Notifications({ flash }: { flash: (s: string) => void }) {
  const [items, setItems] = useState<Notice[]>([]),
    [loading, setLoading] = useState(true);
  const load = () =>
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(d.notifications))
      .catch(() => flash("Notifications could not be loaded"))
      .finally(() => setLoading(false));
  useEffect(() => {
    void load();
  }, []);
  const mark = async (n: Notice) => {
    if (!n.readAt) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
      setItems((current) =>
        current.map((x) =>
          x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x,
        ),
      );
    }
  };
  return (
    <div className="page">
      <PageHead
        title="Notifications"
        desc="Security events and workflow updates requiring attention."
        action={
          <span className="status">
            {items.filter((x) => !x.readAt).length} unread
          </span>
        }
      />
      <section className="panel">
        {loading ? (
          <p>Loading notifications…</p>
        ) : items.length ? (
          items.map((n) => (
            <button key={n.id} className="incidentRow" onClick={() => mark(n)}>
              <span
                className={`badge ${n.type === "Critical" ? "critical" : "medium"}`}
              >
                <i />
                {n.type}
              </span>
              <div className="incidentTitle">
                <b>{n.title}</b>
                <small>
                  {n.message} · {new Date(n.createdAt).toLocaleString("en-NG")}
                </small>
              </div>
              {!n.readAt && <span className="status">New</span>}
              <span className="chev">›</span>
            </button>
          ))
        ) : (
          <Empty
            title="No notifications"
            text="Workflow and critical-incident alerts will appear here."
          />
        )}
      </section>
    </div>
  );
}
function Audit() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  useEffect(() => {
    fetch("/api/audit")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setEntries(d.auditEntries))
      .catch(() => {});
  }, []);
  const fallback = [
    [
      "22:48:14",
      "Nneka Adeyemi",
      "Changed severity",
      "TNG-2026-04872",
      "High → Critical",
      "Online",
    ],
    [
      "22:41:03",
      "System",
      "Grouped duplicate",
      "TNG-2026-04873",
      "Added to cluster CL-019",
      "Online",
    ],
  ];
  const es = entries.length
    ? entries.map((e) => [
        new Date(e.createdAt).toLocaleTimeString("en-NG"),
        e.actorEmail,
        e.action,
        e.incidentId || "—",
        e.reason || e.newValue || "—",
        e.connectionState,
      ])
    : fallback;
  return (
    <div className="page">
      <PageHead
        title="Audit Log"
        desc="Immutable history of triage, privacy and routing actions."
        action={<button className="outline">⇩ Export log</button>}
      />
      <section className="integrity">
        ✓ Audit records loaded{" "}
        <span>
          {entries.length
            ? `${entries.length} durable entries`
            : "Demo entries shown until the first stored action"}
        </span>
      </section>
      <section className="panel tablePanel">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Incident</th>
              <th>Change / reason</th>
              <th>Connection</th>
            </tr>
          </thead>
          <tbody>
            {es.map((e, i) => (
              <tr key={i}>
                {e.map((x, j) => (
                  <td key={j}>
                    {j === 3 ? (
                      <code>{x}</code>
                    ) : j === 5 ? (
                      <span className="status">{x}</span>
                    ) : (
                      x
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
function Users() {
  const [people, setPeople] = useState<WorkspaceUser[]>([]),
    [currentRole, setCurrentRole] = useState("Reporter"),
    [message, setMessage] = useState("");
  const load = () =>
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setPeople(d.users);
        setCurrentRole(d.currentRole);
      })
      .catch(() => setMessage("Users could not be loaded"));
  useEffect(() => {
    void load();
  }, []);
  const changeRole = async (email: string, role: string) => {
    setMessage("");
    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    if (!response.ok) {
      setMessage((await response.json()).error || "Role update failed");
      return;
    }
    setPeople((items) =>
      items.map((p) => (p.email === email ? { ...p, role } : p)),
    );
    setMessage("Role updated and recorded in the audit log");
  };
  const canManage = currentRole === "Administrator";
  return (
    <div className="page">
      <PageHead
        title="Users & Roles"
        desc={`Manage least-privilege access · Your role: ${currentRole}`}
      />
      {message && <div className="privacyNotice">{message}</div>}
      <section className="panel tablePanel">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Privacy access</th>
              <th>Routing approval</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.email}>
                <td>
                  <div className="person">
                    <span className="avatar">
                      {p.displayName
                        .split(" ")
                        .map((x) => x[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <div>
                      <b>{p.displayName}</b>
                      <small>{p.email}</small>
                    </div>
                  </div>
                </td>
                <td>
                  {canManage ? (
                    <select
                      value={p.role}
                      onChange={(e) => changeRole(p.email, e.target.value)}
                    >
                      {[
                        "Administrator",
                        "Senior Analyst",
                        "Analyst",
                        "Auditor",
                        "Reporter",
                      ].map((role) => (
                        <option key={role}>{role}</option>
                      ))}
                    </select>
                  ) : (
                    p.role
                  )}
                </td>
                <td>
                  {["Administrator", "Senior Analyst", "Analyst"].includes(
                    p.role,
                  )
                    ? "Logged access"
                    : "No"}
                </td>
                <td>
                  {["Administrator", "Senior Analyst"].includes(p.role)
                    ? "Yes"
                    : "No"}
                </td>
                <td>
                  <span className="status">{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!people.length && (
          <Empty
            title="No registered users"
            text="Users appear after their first authenticated visit."
          />
        )}
      </section>
    </div>
  );
}
function Settings({ flash }: { flash: (s: string) => void }) {
  return (
    <div className="page">
      <PageHead
        title="Settings"
        desc="Organisation, triage, privacy and resilience controls."
      />
      <div className="settingsGrid">
        <section className="settingsNav panel">
          {[
            "Organisation",
            "Categories",
            "Severity rules",
            "Routing rules",
            "Privacy & retention",
            "Offline & sync",
            "Accessibility",
            "Model information",
          ].map((x, i) => (
            <button className={i === 0 ? "active" : ""} key={x}>
              {x}
              <span>›</span>
            </button>
          ))}
        </section>
        <section className="panel settingsForm">
          <h2>Organisation profile</h2>
          <p>Shown within the workspace and report confirmation pages.</p>
          <label>
            Organisation name
            <input defaultValue="Ahmadu Bello University — Security Operations" />
          </label>
          <label>
            Security contact email
            <input defaultValue="security@example.edu.ng" />
          </label>
          <div className="formRow">
            <label>
              Default timezone
              <select>
                <option>Africa/Lagos (WAT)</option>
              </select>
            </label>
            <label>
              Retention period
              <select>
                <option>180 days</option>
                <option>365 days</option>
              </select>
            </label>
          </div>
          <label className="toggle">
            <input type="checkbox" defaultChecked /> Allow local report drafts
            while offline
          </label>
          <label className="toggle">
            <input type="checkbox" defaultChecked /> Require re-confirmation
            before queued external delivery
          </label>
          <button className="primary" onClick={() => flash("Settings saved")}>
            Save changes
          </button>
        </section>
      </div>
    </div>
  );
}
function Help({ go }: { go: () => void }) {
  return (
    <div className="page">
      <PageHead
        title="Help & Guidance"
        desc="Practical guidance for reporters and analysts."
      />
      <div className="helpGrid">
        <section className="helpHero">
          <small>REPORTING GUIDE</small>
          <h2>Not sure whether it is a cyber incident?</h2>
          <p>
            Submit what you observed. You do not need technical language, and
            Pidgin is welcome.
          </p>
          <button className="primary" onClick={go}>
            Start a report
          </button>
        </section>
        {[
          [
            "How to write a useful report",
            "Tell us what happened, when you noticed it and which device or service was affected.",
          ],
          [
            "Understanding severity",
            "Severity reflects potential harm and urgency. It is reviewed by a human analyst.",
          ],
          [
            "Privacy and redaction",
            "Triage247Ng reduces detected personal information before records are shared onward.",
          ],
          [
            "Emergency response",
            "For active threats or immediate danger, contact your institution’s security desk directly.",
          ],
          [
            "About AI recommendations",
            "The system provides evidence and confidence. Analysts make the final decision.",
          ],
          [
            "English and Pidgin",
            "Write naturally. Do not include passwords, PINs or one-time codes in a report.",
          ],
        ].map((x) => (
          <section className="panel helpCard" key={x[0]}>
            <span>?</span>
            <h3>{x[0]}</h3>
            <p>{x[1]}</p>
            <button>Read guidance →</button>
          </section>
        ))}
      </div>
    </div>
  );
}
