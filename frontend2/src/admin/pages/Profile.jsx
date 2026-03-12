import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Stack,
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  CalendarMonth as CalendarIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  AccessTime as AccessTimeIcon,
  Verified as VerifiedIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import client from "../../services/api/client";
import { ENDPOINTS } from "../../services/api/endpoints";
import { useAuth } from "../../context/AuthContext";

function AdminProfile() {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await client.get(ENDPOINTS.USERS.PROFILE);
      const userData = response.data.data.user;
      setProfile(userData);
      setEditForm({
        name: userData.name || "",
        phone: userData.phone || "",
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile. Please try again.");
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setSaving(true);
      await client.put(ENDPOINTS.USERS.UPDATE_PROFILE, {
        name: editForm.name,
        phone: editForm.phone,
      });
      await refreshUser();
      toast.success("Profile updated successfully!");
      setEditMode(false);
      fetchProfile();
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: profile?.name || "",
      phone: profile?.phone || "",
    });
    setEditMode(false);
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Please enter both current and new password");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      setChangingPassword(true);
      await client.put(ENDPOINTS.USERS.CHANGE_PASSWORD, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Error changing password:", err);
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "ADMIN":
        return "Admin";
      case "SUB_ADMIN":
        return "Sub Admin";
      default:
        return role;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchProfile}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* Profile Header Banner */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
          color: "white",
          borderRadius: 2,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid size={{xs:12,sm:8}}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: "white",
                  color: "primary.main",
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  border: "4px solid rgba(255,255,255,0.3)",
                }}
              >
                {profile?.name?.charAt(0)?.toUpperCase() || "A"}
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: "bold", mb: 0.5 }}>
                  {profile?.name}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    icon={<AdminIcon sx={{ color: "white !important" }} />}
                    label={getRoleLabel(profile?.role)}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.2)",
                      color: "white",
                      fontWeight: "bold",
                      "& .MuiChip-icon": { color: "white" },
                    }}
                  />
                  <Chip
                    icon={<VerifiedIcon sx={{ color: "white !important" }} />}
                    label={profile?.is_active ? "Active" : "Inactive"}
                    sx={{
                      bgcolor: profile?.is_active
                        ? "rgba(82, 196, 26, 0.3)"
                        : "rgba(255, 77, 79, 0.3)",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  />
                </Stack>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  {profile?.email}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={{xs:12,md:4}}>
            <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
              <Stack spacing={1} sx={{ display: "inline-block" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    justifyContent: { xs: "flex-start", md: "flex-end" },
                  }}
                >
                  <BadgeIcon sx={{ fontSize: 18, opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    ID: {profile?.user_id}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    justifyContent: { xs: "flex-start", md: "flex-end" },
                  }}
                >
                  <CalendarIcon sx={{ fontSize: 18, opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Joined: {formatDate(profile?.createdAt)}
                  </Typography>
                </Box>
                {profile?.phone && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      justifyContent: { xs: "flex-start", md: "flex-end" },
                    }}
                  >
                    <PhoneIcon sx={{ fontSize: 18, opacity: 0.8 }} />
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {profile?.phone}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Profile Information Card */}
        <Grid size={{xs:12,lg:6}}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PersonIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Profile Information
                  </Typography>
                </Box>
                {!editMode ? (
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setEditMode(true)}
                    size="small"
                  >
                    Edit
                  </Button>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      startIcon={
                        saving ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <SaveIcon />
                        )
                      }
                      onClick={handleSaveProfile}
                      disabled={saving}
                      size="small"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancelEdit}
                      disabled={saving}
                      size="small"
                    >
                      Cancel
                    </Button>
                  </Stack>
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid  size={{xs:12}}>
                  <TextField
                    label="Full Name"
                    value={editForm.name}
                    onChange={(e) =>
                      handleEditFormChange("name", e.target.value)
                    }
                    fullWidth
                    disabled={!editMode}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{xs:12}}>
                  <TextField
                    label="Email Address"
                    value={profile?.email || ""}
                    fullWidth
                    disabled
                    helperText="Email cannot be changed"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{xs:12,sm:6}}>
                  <TextField
                    label="Phone Number"
                    value={editForm.phone}
                    onChange={(e) =>
                      handleEditFormChange("phone", e.target.value)
                    }
                    fullWidth
                    disabled={!editMode}
                    placeholder="+91 9876543210"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{xs:12,sm:6}}>
                  <TextField
                    label="Role"
                    value={getRoleLabel(profile?.role)}
                    fullWidth
                    disabled
                    helperText="Assigned by system"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AdminIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Change Password Card */}
        <Grid size={{xs:12,lg:6}}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
              >
                <LockIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Change Password
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{xs:12}}>
                  <TextField
                    label="Current Password"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      handlePasswordChange("currentPassword", e.target.value)
                    }
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setShowPasswords((p) => ({
                                ...p,
                                current: !p.current,
                              }))
                            }
                            edge="end"
                            size="small"
                          >
                            {showPasswords.current ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid   size={{xs:12,sm:6}}>
                  <TextField
                    label="New Password"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      handlePasswordChange("newPassword", e.target.value)
                    }
                    fullWidth
                    helperText="At least 6 characters"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setShowPasswords((p) => ({ ...p, new: !p.new }))
                            }
                            edge="end"
                            size="small"
                          >
                            {showPasswords.new ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{xs:12,sm:6}}>
                  <TextField
                    label="Confirm Password"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      handlePasswordChange("confirmPassword", e.target.value)
                    }
                    fullWidth
                    error={
                      passwordForm.confirmPassword &&
                      passwordForm.newPassword !== passwordForm.confirmPassword
                    }
                    helperText={
                      passwordForm.confirmPassword &&
                      passwordForm.newPassword !== passwordForm.confirmPassword
                        ? "Passwords do not match"
                        : " "
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setShowPasswords((p) => ({
                                ...p,
                                confirm: !p.confirm,
                              }))
                            }
                            edge="end"
                            size="small"
                          >
                            {showPasswords.confirm ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleChangePassword}
                    disabled={
                      changingPassword ||
                      !passwordForm.currentPassword ||
                      !passwordForm.newPassword
                    }
                    startIcon={
                      changingPassword ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <LockIcon />
                      )
                    }
                    fullWidth
                    sx={{ mt: 1 }}
                  >
                    {changingPassword
                      ? "Changing Password..."
                      : "Update Password"}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Statistics Card */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
              >
                <SecurityIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Account Overview
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{xs:6,sm:3}}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: "#e6f7ff",
                      borderRadius: 2,
                      textAlign: "center",
                      border: "1px solid #91d5ff",
                    }}
                  >
                    <BadgeIcon sx={{ fontSize: 32, color: "#1890ff", mb: 1 }} />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      User ID
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="primary.main"
                    >
                      {profile?.user_id}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{xs:6,sm:3}}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: "#fff7e6",
                      borderRadius: 2,
                      textAlign: "center",
                      border: "1px solid #ffd591",
                    }}
                  >
                    <AdminIcon sx={{ fontSize: 32, color: "#fa8c16", mb: 1 }} />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Account Type
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      sx={{ color: "#fa8c16" }}
                    >
                      {getRoleLabel(profile?.role)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{xs:6,sm:3}}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: profile?.is_active ? "#f6ffed" : "#fff2f0",
                      borderRadius: 2,
                      textAlign: "center",
                      border: profile?.is_active
                        ? "1px solid #b7eb8f"
                        : "1px solid #ffa39e",
                    }}
                  >
                    <VerifiedIcon
                      sx={{
                        fontSize: 32,
                        color: profile?.is_active ? "#52c41a" : "#ff4d4f",
                        mb: 1,
                      }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Status
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      sx={{ color: profile?.is_active ? "#52c41a" : "#ff4d4f" }}
                    >
                      {profile?.is_active ? "Active" : "Inactive"}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{xs:6,sm:3}}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: "#f9f0ff",
                      borderRadius: 2,
                      textAlign: "center",
                      border: "1px solid #d3adf7",
                    }}
                  >
                    <AccessTimeIcon
                      sx={{ fontSize: 32, color: "#722ed1", mb: 1 }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Last Updated
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{ color: "#722ed1" }}
                    >
                      {formatDate(profile?.updatedAt)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AdminProfile;
