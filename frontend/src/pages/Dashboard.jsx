import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import AdminDashboard from "./dashboard/AdminDashboard";
import UserHome from "./dashboard/UserHome";

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = Boolean(user?.isAdmin);
  const { totalItems } = useCart();
  return isAdmin ? (
    <AdminDashboard />
  ) : (
    <UserHome user={user} totalItems={totalItems} />
  );
};

export default Dashboard;
