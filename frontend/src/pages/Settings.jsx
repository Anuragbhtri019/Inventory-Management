import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import AppLayout from "../layouts/AppLayout";
import Button from "../components/Button";
import Input from "../components/Input";
import api from "../services/api";
import { useNotifications } from "../contexts/NotificationContext";

const Settings = () => {
  const { addActivity } = useNotifications();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);

  const changePassword = async () => {
    setChanging(true);
    try {
      await api.patch("/users/me/password", {
        oldPassword,
        newPassword,
        confirmPassword,
      });
      toast.success("Password changed");
      addActivity({
        type: "success",
        message: "Password changed",
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setChanging(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/75 dark:bg-deep-950/35 backdrop-blur-xl shadow-glass p-6">
          <h1 className="text-xl font-display font-bold text-slate-900 dark:text-accent-100">
            Settings / Account
          </h1>
          <p className="text-sm text-slate-700 dark:text-mid-300 mt-2">
            Manage account security.
          </p>

          <div className="mt-6 space-y-4">
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-accent-100">
              Change password
            </h2>
            <Input
              label="Current password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
              variant="primary"
              className="w-full"
              onClick={changePassword}
              disabled={changing}
            >
              {changing ? "Changing..." : "Change password"}
            </Button>

            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-slate-700 dark:text-mid-300 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
