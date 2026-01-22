import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Unauthorized() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-8 space-y-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
        <p className="text-sm text-slate-600">
          You do not have permission to view this area. {user ? "Select a permitted portal." : "Please sign in."}
        </p>
        <div className="flex flex-col gap-2">
          <Link className="text-blue-600 font-semibold hover:underline" to="/">
            Go to home
          </Link>
          {!user && (
            <Link className="text-blue-600 font-semibold hover:underline" to="/login">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
