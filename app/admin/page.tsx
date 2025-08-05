import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { generateMetadata } from "@/lib/metadata"

export const metadata = generateMetadata({
  title: "Admin Dashboard",
  description: "Admin dashboard for SoulBond AI",
  noIndex: true,
})

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  // Check if user is authenticated and is admin
  if (!session?.user?.email || session.user.email !== "kouam7@gmail.com") {
    redirect("/")
  }
  
  return <AdminDashboard userEmail={session.user.email} />
}