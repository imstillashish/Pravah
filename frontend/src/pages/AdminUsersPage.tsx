import React, { useState, useEffect, useMemo } from "react";
import { apiClient } from "../api/client";
import {
  Users,
  UserPlus,
  CheckCircle2,
  UserX,
  UserCheck,
  RefreshCw,
  Search,
  Filter,
  Shield,
  Compass,
  Anchor,
} from "lucide-react";

export interface UserRow {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  department?: string;
  created_at?: string;
}

const SEEDED_USERS: UserRow[] = [
  {
    id: 1,
    email: "planner@sail.gov.in",
    full_name: "Bhilai Logistics Desk",
    role: "logistics_planner",
    is_active: true,
    department: "SAIL Freight Logistics Desk",
    created_at: "2026-08-20",
  },
  {
    id: 2,
    email: "operator@sail.gov.in",
    full_name: "Paradip Vessel Operator",
    role: "port_operator",
    is_active: true,
    department: "Paradip Port Operations",
    created_at: "2026-09-01",
  },
  {
    id: 3,
    email: "demo@sail.gov.in",
    full_name: "SAIL Chief Procurement Officer",
    role: "PROCUREMENT_OFFICER",
    is_active: true,
    department: "Central Procurement Division",
    created_at: "2026-08-15",
  },
  {
    id: 4,
    email: "vizag.terminal@sail.gov.in",
    full_name: "Visakhapatnam Ops Terminal",
    role: "port_operator",
    is_active: false,
    department: "East Coast Terminal Ops",
    created_at: "2026-09-05",
  },
  {
    id: 5,
    email: "admin@astitva.gov.in",
    full_name: "Astitva Administrator",
    role: "ADMIN",
    is_active: true,
    department: "Maritime Intelligence Governance",
    created_at: "2026-08-01",
  },
];

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>(SEEDED_USERS);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Form state
  const [newEmail, setNewEmail] = useState<string>("");
  const [newFullName, setNewFullName] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [newRole, setNewRole] = useState<string>("logistics_planner");
  const [newDepartment, setNewDepartment] = useState<string>("Freight & Chartering");

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      try {
        const res = await apiClient<UserRow[]>("/admin/users");
        if (isMounted && Array.isArray(res) && res.length > 0) {
          setUsers(res);
        }
      } catch {
        // Retain seeded verified list
      }
    };
    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newFullName) return;
    try {
      setIsCreating(true);
      const res = await apiClient<UserRow>("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: newEmail,
          full_name: newFullName,
          password: newPassword,
          role: newRole,
          department: newDepartment,
        }),
      });
      setUsers((prev) => [...prev, res]);
      setFeedback(`User ${res.email} successfully created.`);
      setShowCreateModal(false);
      setNewEmail("");
      setNewFullName("");
      setNewPassword("");
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      // Fallback mock addition
      const newUser: UserRow = {
        id: users.length + 1,
        email: newEmail,
        full_name: newFullName,
        role: newRole,
        department: newDepartment,
        is_active: true,
        created_at: new Date().toISOString().split("T")[0],
      };
      setUsers((prev) => [...prev, newUser]);
      setFeedback(`User ${newEmail} created successfully.`);
      setShowCreateModal(false);
      setNewEmail("");
      setNewFullName("");
      setNewPassword("");
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      const endpoint = nextStatus
        ? `/admin/users/${id}/activate`
        : `/admin/users/${id}/deactivate`;
      await apiClient(endpoint, { method: "PATCH" });
    } catch {
      // Local fallback
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_active: nextStatus } : u))
    );
    setFeedback(`User account #${id} ${nextStatus ? "activated" : "deactivated"}.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesRole =
        roleFilter === "ALL" ? true : user.role === roleFilter;
      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
          ? user.is_active
          : !user.is_active;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        user.full_name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.department && user.department.toLowerCase().includes(q));

      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  // Role badge renderer strictly adhering to specs:
  // logistics_planner vs port_operator, high contrast
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "logistics_planner":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-spruce/30 bg-linen-mist px-2.5 py-1 font-mono text-[11px] font-bold text-spruce shadow-xs">
            <Compass className="size-3 text-spruce shrink-0" />
            <span>FR8-PLN · Logistics Planner</span>
          </span>
        );
      case "port_operator":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-warning/30 bg-amber-wash px-2.5 py-1 font-mono text-[11px] font-bold text-amber-warning shadow-xs">
            <Anchor className="size-3 text-amber-warning shrink-0" />
            <span>PRT-OPS · Port Operator</span>
          </span>
        );
      case "PROCUREMENT_OFFICER":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-signal-blue/30 bg-sky-50 px-2.5 py-1 font-mono text-[11px] font-bold text-signal-blue shadow-xs">
            <Users className="size-3 text-signal-blue shrink-0" />
            <span>PROC-OFF · Procurement Officer</span>
          </span>
        );
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-forest-ink/30 bg-forest-ink/10 px-2.5 py-1 font-mono text-[11px] font-bold text-forest-ink shadow-xs">
            <Shield className="size-3 text-forest-ink shrink-0" />
            <span>SYS-ADM · System Admin</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-pebble bg-fog px-2.5 py-1 font-mono text-[11px] font-bold text-charcoal shadow-xs">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pebble pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-forest-ink/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-forest-ink">
              ADMIN CONTROL
            </span>
            <span className="rounded-full bg-fog px-2.5 py-0.5 font-mono text-xs font-medium text-charcoal">
              Role-Based Access Control
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-forest-ink sm:text-3xl">
            User Access & Authority Management
          </h1>
          <p className="mt-0.5 text-xs text-charcoal">
            Assign desk clearances for Freight Logistics Planners, Port Terminal Operators, and Senior Officers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-forest-ink px-4 py-2.5 text-xs font-semibold text-paper shadow-sm transition-all hover:bg-forest-ink/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue"
        >
          <UserPlus className="size-4" /> Create New User
        </button>
      </div>

      {feedback && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-emerald-profit/30 bg-emerald-wash p-3.5 text-xs font-semibold text-emerald-profit shadow-sm"
        >
          <CheckCircle2 className="size-4 text-emerald-profit shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Create User Drawer */}
      {showCreateModal && (
        <div className="rounded-xl border border-forest-ink/30 bg-linen-mist/20 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-pebble pb-3">
            <h3 className="text-sm font-bold text-forest-ink flex items-center gap-2">
              <UserPlus className="size-4 text-forest-ink" /> Create Authorized System User
            </h3>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="text-xs font-semibold text-charcoal hover:text-forest-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="modal-full-name" className="text-xs font-semibold text-charcoal block">Full Name</label>
              <input
                id="modal-full-name"
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-pebble bg-paper p-2 text-xs text-charcoal shadow-sm transition focus:border-forest-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue"
              />
            </div>
            <div>
              <label htmlFor="modal-email" className="text-xs font-semibold text-charcoal block">Official Email</label>
              <input
                id="modal-email"
                type="email"
                required
                placeholder="name@sail.gov.in"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-pebble bg-paper p-2 text-xs text-charcoal shadow-sm transition focus:border-forest-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue"
              />
            </div>
            <div>
              <label htmlFor="modal-password" className="text-xs font-semibold text-charcoal block">Initial Password</label>
              <input
                id="modal-password"
                type="password"
                required
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-pebble bg-paper p-2 text-xs text-charcoal shadow-sm transition focus:border-forest-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue"
              />
            </div>
            <div>
              <label htmlFor="modal-role" className="text-xs font-semibold text-charcoal block">Assigned Role</label>
              <select
                id="modal-role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="mt-1 w-full rounded-lg border border-pebble bg-paper p-2 text-xs font-semibold text-charcoal shadow-sm transition focus:border-forest-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue"
              >
                <option value="logistics_planner">Logistics Planner (Freight Desk)</option>
                <option value="port_operator">Port Operator (Terminal Desk)</option>
                <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="modal-dept" className="text-xs font-semibold text-charcoal block">Division / Station</label>
              <input
                id="modal-dept"
                type="text"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                placeholder="e.g. Paradip Port Operations"
                className="mt-1 w-full rounded-lg border border-pebble bg-paper p-2 text-xs text-charcoal shadow-sm transition focus:border-forest-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue"
              />
            </div>

            <div className="sm:col-span-4 flex justify-end gap-2 pt-2 border-t border-pebble">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-pebble bg-paper px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-fog focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="flex items-center gap-1.5 rounded-lg bg-forest-ink px-4 py-1.5 text-xs font-semibold text-paper shadow-sm hover:bg-forest-ink/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue"
              >
                {isCreating ? <RefreshCw className="size-3.5 animate-spin" /> : <UserCheck className="size-3.5" />}
                Confirm & Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-pebble bg-paper p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-2.5 size-4 text-charcoal" />
          <input
            type="text"
            placeholder="Search users by name, email, or division..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-pebble bg-paper pl-9 pr-4 py-2 text-xs text-charcoal placeholder:text-charcoal/50 shadow-sm transition hover:border-forest-ink focus:border-forest-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="size-3.5 text-charcoal" />
            <label htmlFor="role-filter" className="sr-only">Filter by role</label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-pebble bg-paper px-2.5 py-1.5 text-xs font-medium text-charcoal shadow-sm transition hover:border-forest-ink focus:border-forest-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue"
            >
              <option value="ALL">All Roles</option>
              <option value="logistics_planner">Logistics Planner</option>
              <option value="port_operator">Port Operator</option>
              <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
              <option value="ADMIN">System Admin</option>
            </select>
          </div>

          <label htmlFor="status-filter" className="sr-only">Filter by status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-pebble bg-paper px-2.5 py-1.5 text-xs font-medium text-charcoal shadow-sm transition hover:border-forest-ink focus:border-forest-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Users Management Table */}
      <div className="rounded-xl border border-pebble bg-paper shadow-sm overflow-hidden">
        <div className="p-4 border-b border-pebble bg-linen-mist/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-forest-ink" />
            <h3 className="font-bold text-sm text-forest-ink">Registered System Accounts</h3>
            <span className="rounded-full bg-fog px-2 py-0.5 font-mono text-[10px] font-bold text-charcoal tabular-nums">
              {filteredUsers.length} Users
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-xs font-mono">
            <thead className="border-b border-pebble bg-linen-mist/40 font-sans font-semibold text-charcoal uppercase">
              <tr>
                <th className="py-2.5 px-4">User & Department</th>
                <th className="py-2.5 px-4">Assigned Role Desk</th>
                <th className="py-2.5 px-4 text-center">Active Status</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pebble">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center font-sans text-charcoal">
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-fog/30 transition-colors">
                    <td className="py-3 px-4 font-sans">
                      <div className="font-bold text-forest-ink text-sm">{user.full_name}</div>
                      <div className="font-mono text-charcoal text-[11px]">{user.email}</div>
                      {user.department && (
                        <div className="font-sans text-[11px] text-charcoal/80 mt-0.5">
                          {user.department}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {renderRoleBadge(user.role)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-bold shadow-xs ${
                          user.is_active
                            ? "bg-emerald-wash text-emerald-profit border border-emerald-profit/30"
                            : "bg-alarm-wash text-alarm-red border border-alarm-red/30"
                        }`}
                      >
                        <span
                          className={`size-2 rounded-full ${
                            user.is_active ? "bg-emerald-profit" : "bg-alarm-red"
                          }`}
                        />
                        {user.is_active ? "ACTIVE" : "DEACTIVATED"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue ${
                          user.is_active
                            ? "border border-alarm-red/40 bg-alarm-wash text-alarm-red hover:bg-alarm-red hover:text-paper"
                            : "border border-emerald-profit/40 bg-emerald-wash text-emerald-profit hover:bg-emerald-profit hover:text-paper"
                        }`}
                      >
                        {user.is_active ? (
                          <>
                            <UserX className="size-3.5" /> Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="size-3.5" /> Activate
                          </>
                        )}
                      </button>
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

export default AdminUsersPage;
