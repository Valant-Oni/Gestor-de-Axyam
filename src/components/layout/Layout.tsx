import { Sidebar } from './Sidebar'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 bg-background">
        {children}
      </main>
    </div>
  )
}
