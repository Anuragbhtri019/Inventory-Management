import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AppLayout from "../layouts/AppLayout";
import Button from "../components/Button";
import Input from "../components/Input";
import api from "../services/api";

const AdminUsers = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setUsers(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const sorted = useMemo(() => {
    return [...users].sort((a, b) => {
      const ad = new Date(a.createdAt || 0).getTime();
      const bd = new Date(b.createdAt || 0).getTime();
      return bd - ad;
    });
  }, [users]);

  const save = async () => {
    if (!editing?._id) return;
    setSaving(true);
    try {
      const payload = {
        name: editing.name,
        email: editing.email,
        phone: editing.phone || "",
        avatarUrl: editing.avatarUrl || "",
        isEmailVerified: Boolean(editing.isEmailVerified),
      };
      const { data } = await api.patch(`/users/${editing._id}`, payload);
      const updated = data.data;
      setUsers((prev) =>
        prev.map((u) => (u._id === updated._id ? updated : u)),
      );
      toast.success("User updated");
      setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-accent-100">
            Users
          </h1>
          <p className="text-sm text-slate-700 dark:text-mid-300">
            View and Edit user details .
          </p>
        </div>
        <Button variant="outline" onClick={fetchUsers}>
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/75 dark:bg-deep-950/35 backdrop-blur-xl shadow-glass overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-brand-400 to-sun-400" />
        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-700 dark:text-mid-300">
              Loading users...
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center text-slate-700 dark:text-mid-300">
              No users found.
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((u) => (
                <div
                  key={u._id}
                  className="rounded-xl border border-slate-200/70 dark:border-deep-700/70 bg-white/70 dark:bg-deep-950/25 p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-accent-100 truncate">
                          {u.name}
                        </p>

                        {(u?.isAdmin || u?.role === "admin") && (
                          <span className="shrink-0 inline-flex items-center rounded-full border border-sun-200/70 bg-sun-50/80 px-2 py-0.5 text-[11px] font-bold text-sun-900 dark:border-deep-700/70 dark:bg-deep-950/35 dark:text-sun-200">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-mid-400 mt-1 break-all">
                        {u.email}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-mid-400 mt-1">
                        Verified: {u.isEmailVerified ? "Yes" : "No"}
                        {u.phone ? ` • Phone: ${u.phone}` : ""}
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setEditing(u)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close edit user modal"
            onClick={() => setEditing(null)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/30 dark:border-deep-700/70 bg-white dark:bg-deep-950 shadow-glass-lg"
          >
            <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-200/70 dark:border-deep-700">
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900 dark:text-accent-100">
                  Edit user
                </h2>
                <p className="text-sm text-slate-700 dark:text-mid-300 mt-1">
                  Update user details (no password changes)
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(null)}
              >
                Close
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
              <Input
                label="Name"
                value={editing.name || ""}
                onChange={(e) =>
                  setEditing((p) => ({ ...p, name: e.target.value }))
                }
              />
              <Input
                label="Email"
                type="email"
                value={editing.email || ""}
                onChange={(e) =>
                  setEditing((p) => ({ ...p, email: e.target.value }))
                }
              />
              <Input
                label="Phone"
                value={editing.phone || ""}
                onChange={(e) =>
                  setEditing((p) => ({ ...p, phone: e.target.value }))
                }
              />
              <Input
                label="Avatar URL"
                type="url"
                value={editing.avatarUrl || ""}
                onChange={(e) =>
                  setEditing((p) => ({ ...p, avatarUrl: e.target.value }))
                }
              />

              <label className="flex items-center gap-3 text-sm font-semibold text-slate-900 dark:text-mid-300">
                <input
                  type="checkbox"
                  checked={Boolean(editing.isEmailVerified)}
                  onChange={(e) =>
                    setEditing((p) => ({
                      ...p,
                      isEmailVerified: e.target.checked,
                    }))
                  }
                />
                Email verified
              </label>

              <div className="pt-2 flex gap-3">
                <Button variant="primary" disabled={saving} onClick={save}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  disabled={saving}
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminUsers;
