import { MembersTable } from "@/components/members/MembersTable"

export default function MembersPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto h-[calc(100vh-80px)]">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Members</h1>
          <p className="text-sm text-secondary mt-1 tracking-wide">Manage memberships and view attendance history</p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <MembersTable />
      </div>
    </div>
  )
}
