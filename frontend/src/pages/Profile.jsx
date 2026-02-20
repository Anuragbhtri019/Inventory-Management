import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AppLayout from "../layouts/AppLayout";
import Button from "../components/Button";
import Input from "../components/Input";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const Profile = () => {
  const { user } = useAuth();
  const { addActivity } = useNotifications();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setPhone(user?.phone || "");
    setAvatarUrl(user?.avatarUrl || "");
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/users/me", {
        name,
        email,
        phone,
        avatarUrl,
      });
      toast.success(data.message || "Profile updated");
      addActivity({
        type: "success",
        message: "Profile updated successfully",
      });
      if (data.requiresEmailVerification) {
        toast.info("Please verify your new email address");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const onAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      toast.error("Please choose an image file");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be less than 2MB");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setAvatarUrl(result);
        toast.success("Avatar image selected");
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read image");
    };
    reader.readAsDataURL(file);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-white/50 dark:border-deep-700/70 bg-white/75 dark:bg-deep-950/35 backdrop-blur-xl shadow-glass p-6">
          <h1 className="text-xl font-display font-bold text-slate-900 dark:text-accent-100">
            Profile
          </h1>
          <p className="text-sm text-slate-700 dark:text-mid-300 mt-2">
            Update your details.
          </p>

          <div className="mt-6 space-y-4">
            <Input
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <div className="space-y-3">
              <Input
                label="Profile picture URL (optional)"
                type="url"
                value={avatarUrl?.startsWith("data:image/") ? "" : avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-900 dark:text-mid-300">
                  Or upload image (max 2MB)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onAvatarFileChange}
                  className="
                    w-full px-4 py-3 rounded-lg border-2
                    bg-white dark:bg-deep-950
                    font-medium text-slate-900 dark:text-accent-100
                    focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-deep-950
                    transition-all duration-200
                    border-slate-200/70 dark:border-deep-700/70 focus:ring-brand-400 focus:border-brand-400 hover:border-slate-300 dark:hover:border-deep-600
                  "
                />
                <p className="text-xs text-slate-600 dark:text-mid-400">
                  Uploading stores the image in your profile as a data URL.
                </p>
              </div>

              {avatarUrl ? (
                <div className="rounded-xl border border-slate-200/70 dark:border-deep-700/70 bg-white/60 dark:bg-deep-950/20 p-4 flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full overflow-hidden border border-slate-200/70 dark:border-deep-700/70 bg-white dark:bg-deep-950">
                    <img
                      src={avatarUrl}
                      alt="Avatar preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-accent-100">
                      Preview
                    </p>
                    <p className="text-xs text-slate-600 dark:text-mid-400 truncate">
                      {avatarUrl.startsWith("data:image/") ? "Uploaded image" : avatarUrl}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setAvatarUrl("")}
                  >
                    Remove
                  </Button>
                </div>
              ) : null}
            </div>

            <Button
              variant="primary"
              className="w-full"
              onClick={saveProfile}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>

            <p className="text-xs text-slate-600 dark:text-mid-400">
              If you change your email, a new verification code is sent.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
