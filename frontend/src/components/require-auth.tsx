import { Navigate } from "react-router";

import { useUser } from "@/lib/auth";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user, isPending } = useUser();

  if (isPending)
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
