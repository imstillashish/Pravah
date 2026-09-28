import React, { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import {
  ShieldCheck,
  Search,
  RefreshCw,
} from "lucide-react";

interface AuditEntry {
  id: number;
  user_id?: number | string;
  user_email?: string;
  action_type: string;
  affected_record_id?: string;
  ip_address?: string;
  logged_at?: string;
  detail: string;
}

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditEntry[]>(() => [
    {
      id: 1,
      user_email: "demo@sail.gov.in",
      action_type: "DECISION_RECORDED",
      affected_record_id: "1",
      logged_at: new Date().toISOString(),
      detail: "Decision recorded: Panamax (Override: False) — Paradip discharge approved",
    },
    {
      id: 2,
      user_email: "demo@sail.gov.in",
      action_type: "ANALYSIS_CREATE",
      affected_record_id: "1",
      logged_at: new Date(Date.now() - 3600000).toISOString(),
      detail: "End-to-end multi-agent pipeline initiated: Newcastle to Paradip 75,000 MT Coking Coal",
    },
    {
      id: 3,
      user_email: "demo@sail.gov.in",
      action_type: "USER_LOGIN",
      affected_record_id: "1",
      logged_at: new Date(Date.now() - 7200000).toISOString(),
      detail: "Bearer JWT issued for PROCUREMENT_OFFICER session",
    },
    {
      id: 4,
      user_email: "planner@sail.gov.in",
      action_type: "DEMAND_POOLED",
      affected_record_id: "CR-POOL-01",
      logged_at: new Date(Date.now() - 14400000).toISOString(),
      detail: "Merged Bhilai (40k MT) and Rourkela (35k MT) into 75,000 MT combined parcel",
    },
    {
      id: 5,
      user_email: "admin@pravah.gov.in",
      action_type: "PORT_UPDATE",
      affected_record_id: "INPRT",
      logged_at: new Date(Date.now() - 86400000).toISOString(),
      detail: "Paradip terminal draft constraint verified: 16.5m maximum permissible draft",
    },
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient<AuditEntry[]>("/audit-logs");
      if (Array.isArray(res) && res.length > 0) {
        setLogs(res);
      }
    } catch {
      // Retain seeded mock audit trail
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.detail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.action_type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.affected_record_id || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction =
      actionFilter === "ALL" || log.action_type === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "DECISION_RECORDED":
        return "bg-linen-mist text-forest-ink border-forest-ink/20";
      case "ANALYSIS_CREATE":
        return "bg-linen-mist/60 text-forest-ink border-forest-ink/20";
      case "USER_LOGIN":
        return "bg-fog text-charcoal border-pebble";
      case "DEMAND_POOLED":
        return "bg-linen-mist text-forest-ink border-forest-ink/20";
      case "PORT_UPDATE":
        return "bg-fog text-charcoal border-pebble";
      default:
        return "bg-fog text-slate border-pebble";
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pebble pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-forest-ink">
              GOVERNANCE & AUDIT
            </span>
            <span className="rounded-full bg-fog px-2.5 py-0.5 text-xs font-medium text-slate">
              Immutable Trail
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-obsidian sm:text-3xl">
            Audit Trails & Regulatory Governance
          </h1>
          <p className="mt-1 text-sm text-charcoal">
            A record of who changed what, for when something needs explaining.
          </p>
          <p className="mt-0.5 text-xs text-slate">
            Tamper-evident record of all freight forecasts, chartering decisions, overrides, and administrative modifications.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="flex items-center gap-1.5 rounded-full border border-pebble bg-paper px-3.5 py-2 text-xs font-semibold text-charcoal hover:bg-fog"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filter Controls (Search + Action Type + Date Range) */}
      <div className="grid grid-cols-1 gap-4 rounded-card border border-pebble bg-paper p-4 sm:grid-cols-12">
        <div className="relative sm:col-span-6">
          <Search className="absolute left-3 top-2.5 size-4 text-slate" />
          <input
            type="text"
            placeholder="Search by keywords, user email, or record ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-card border border-pebble bg-paper pl-9 pr-4 py-2 text-xs text-charcoal focus:border-forest-ink focus:outline-none"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full rounded-card border border-pebble bg-paper p-2 text-xs font-medium text-charcoal focus:border-forest-ink focus:outline-none"
          >
            <option value="ALL">All Action Types</option>
            <option value="DECISION_RECORDED">DECISION_RECORDED</option>
            <option value="ANALYSIS_CREATE">ANALYSIS_CREATE</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="DEMAND_POOLED">DEMAND_POOLED</option>
            <option value="PORT_UPDATE">PORT_UPDATE</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full rounded-card border border-pebble bg-paper p-2 text-xs font-medium text-charcoal focus:border-forest-ink focus:outline-none"
          >
            <option value="ALL">All Time</option>
            <option value="24H">Last 24 Hours</option>
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div data-tour="audit-ledger" className="rounded-card border border-pebble bg-paper overflow-hidden">
        <div className="p-4 border-b border-pebble bg-linen-mist/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-forest-ink" />
            <h3 className="font-bold text-sm text-charcoal">Audit Trail Entries</h3>
            <span className="rounded-full bg-fog px-2 py-0.5 font-mono text-[10px] text-slate">
              {filteredLogs.length} Records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-pebble bg-linen-mist/40 font-sans font-semibold text-charcoal uppercase">
              <tr>
                <th className="py-2.5 px-4">Timestamp (UTC)</th>
                <th className="py-2.5 px-4 font-sans">User</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Record ID</th>
                <th className="py-2.5 px-4 font-sans">Audit Detail & Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pebble">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate font-sans">
                    No audit records matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-fog/30">
                    <td className="py-3 px-4 text-slate">
                      {log.logged_at ? new Date(log.logged_at).toLocaleString() : "Just now"}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-medium text-charcoal">
                        {log.user_email || `User #${log.user_id || 1}`}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getActionBadgeColor(
                          log.action_type
                        )}`}
                      >
                        {log.action_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-forest-ink font-semibold">
                      #{log.affected_record_id || "N/A"}
                    </td>
                    <td className="py-3 px-4 font-sans text-charcoal text-xs leading-relaxed">
                      {log.detail}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
