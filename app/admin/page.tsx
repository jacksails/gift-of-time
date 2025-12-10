"use client"

import { useEffect, useMemo, useState } from "react"
import type { Gift } from "@/types/gift"

type ClientRow = {
  id: string
  firstName: string
  lastName: string
  companyName: string
  email: string
  token: string
  hasSelectedGift: boolean
  selectedGiftId: string | null
  selectedGiftTitle: string | null
  selectedAt: string | null
}

type GiftFormState = Partial<Gift>

async function jsonFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; details?: string }
    const errorMsg = body.details ? `${body.error}: ${body.details}` : body.error || "SERVER_ERROR"
    throw new Error(errorMsg)
  }
  return res.json()
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [password, setPassword] = useState("")

  const [clients, setClients] = useState<ClientRow[]>([])
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [giftCreateError, setGiftCreateError] = useState<string | null>(null)
  const [clientEdits, setClientEdits] = useState<Record<string, Partial<ClientRow>>>({})
  const [clientSaving, setClientSaving] = useState<Record<string, boolean>>({})
  const [clientDeleting, setClientDeleting] = useState<Record<string, boolean>>({})
  const [clientError, setClientError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [editingGiftId, setEditingGiftId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"clients" | "gifts">("clients")

  const [clientForm, setClientForm] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
  })

  const [giftEdits, setGiftEdits] = useState<Record<string, GiftFormState>>({})
  const [giftCreate, setGiftCreate] = useState<GiftFormState>({
    slug: "",
    title: "",
    strapline: "",
    description: "",
    ledByName: "",
    ledByRole: "",
    format: "",
    sortOrder: gifts.length + 1,
    isActive: true,
  })
  const [giftSaving, setGiftSaving] = useState<Record<string, boolean>>({})
  const [giftError, setGiftError] = useState<Record<string, string | null>>({})

  const loadSession = async () => {
    const res = await fetch("/api/admin/proxy/session")
    if (res.ok) {
      setAuthed(true)
    } else {
      setAuthed(false)
    }
  }

  useEffect(() => {
    loadSession().catch(() => setAuthed(false))
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [clientsData, giftsData] = await Promise.all([
        jsonFetch<ClientRow[]>("/api/admin/proxy/clients"),
        jsonFetch<Gift[]>("/api/admin/proxy/gifts"),
      ])
      setClients(clientsData)
      setGifts(giftsData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authed) {
      loadData().catch((err) => setAuthError(err.message))
    }
  }, [authed])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setAuthed(true)
      setPassword("")
      await loadData()
    } else {
      setAuthError("Invalid password")
    }
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    setInviteUrl(null)
    try {
      const payload = await jsonFetch<{ client: ClientRow; inviteUrl: string }>("/api/admin/proxy/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientForm),
      })
      setInviteUrl(payload.inviteUrl)
      setClientForm({ firstName: "", lastName: "", companyName: "", email: "" })
      await loadData()
    } catch (err) {
      setCreateError((err as Error).message || "SERVER_ERROR")
    }
  }

  const giftsSorted = useMemo(
    () => [...gifts].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [gifts],
  )

  const baseUrl =
    process.env.BASE_URL ||
    process.env.API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "")

  const inviteFor = (token: string) => (baseUrl ? `${baseUrl}?t=${encodeURIComponent(token)}` : token)

  const handleGiftChange = (id: string, field: keyof GiftFormState, value: unknown) => {
    setGiftEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }))
  }

  const handleSaveGift = async (id: string) => {
    setGiftSaving((prev) => ({ ...prev, [id]: true }))
    setGiftError((prev) => ({ ...prev, [id]: null }))
    const edit = giftEdits[id] || {}
    try {
      const updated = await jsonFetch<Gift>(`/api/admin/proxy/gifts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...edit,
          duration: typeof edit.duration === "string" ? edit.duration.trim() || null : edit.duration,
          sortOrder: typeof edit.sortOrder === "string" ? Number(edit.sortOrder) || 0 : edit.sortOrder,
        }),
      })
      setGifts((prev) => prev.map((g) => (g.id === id ? updated : g)))
      setGiftEdits((prev) => {
        const { [id]: _, ...rest } = prev
        return rest
      })
      setEditingGiftId(null)
    } catch (err) {
      setGiftError((prev) => ({ ...prev, [id]: (err as Error).message || "SERVER_ERROR" }))
    } finally {
      setGiftSaving((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleCreateGift = async (e: React.FormEvent) => {
    e.preventDefault()
    setGiftCreateError(null)
    try {
      const created = await jsonFetch<Gift>(`/api/admin/proxy/gifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...giftCreate,
          duration: typeof giftCreate.duration === "string" ? giftCreate.duration.trim() || null : giftCreate.duration,
          sortOrder:
            typeof giftCreate.sortOrder === "string" ? Number(giftCreate.sortOrder) || gifts.length + 1 : giftCreate.sortOrder,
        }),
      })
      setGifts((prev) => [...prev, created])
      setGiftCreate({
        slug: "",
        title: "",
        strapline: "",
        description: "",
        ledByName: "",
        ledByRole: "",
        format: "",
        sortOrder: (gifts.length || 0) + 1,
        isActive: true,
      })
    } catch (err) {
      setGiftCreateError((err as Error).message || "SERVER_ERROR")
    }
  }

  const handleSaveClient = async (id: string) => {
    const edit = clientEdits[id]
    if (!edit) return
    setClientError(null)
    setClientSaving((p) => ({ ...p, [id]: true }))
    try {
      const updated = await jsonFetch<ClientRow>(`/api/admin/proxy/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit),
      })
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)))
      setClientEdits((p) => {
        const { [id]: _, ...rest } = p
        return rest
      })
      setEditingClientId(null)
    } catch (err) {
      setClientError((err as Error).message || "SERVER_ERROR")
    } finally {
      setClientSaving((p) => ({ ...p, [id]: false }))
    }
  }

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm("Delete this client? This cannot be undone.")) return
    setClientError(null)
    setClientDeleting((p) => ({ ...p, [id]: true }))
    try {
      await jsonFetch<{ success: boolean }>(`/api/admin/proxy/clients/${id}`, {
        method: "DELETE",
      })
      setClients((prev) => prev.filter((c) => c.id !== id))
      setClientEdits((p) => {
        const { [id]: _, ...rest } = p
        return rest
      })
    } catch (err) {
      setClientError((err as Error).message || "SERVER_ERROR")
    } finally {
      setClientDeleting((p) => ({ ...p, [id]: false }))
    }
  }

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // no-op
    }
  }

  const handleImport = async (file: File) => {
    setIsImporting(true)
    setImportError(null)
    setImportResult(null)
    try {
      const text = await file.text()
      const res = await fetch("/api/admin/proxy/clients/import", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text,
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error || "SERVER_ERROR")
      }
      setImportResult(`Created ${body.createdCount || 0}${body.errors?.length ? `, errors: ${body.errors.length}` : ""}`)
      await loadData()
    } catch (err) {
      setImportError((err as Error).message || "SERVER_ERROR")
    } finally {
      setIsImporting(false)
    }
  }

  const handleExport = () => {
    window.location.href = "/api/admin/proxy/clients/export"
  }

  // Login screen
  if (authed === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
            <h1 className="text-2xl font-semibold text-white mb-6 text-center">Admin Login</h1>
            <form className="space-y-4" onSubmit={handleLogin}>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              {authError && <p className="text-sm text-red-400 text-center">{authError}</p>}
              <button
                type="submit"
                className="w-full rounded-lg bg-white text-slate-900 px-4 py-3 font-medium hover:bg-white/90 transition-colors"
              >
                Log in
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (authed === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white/60">Checking session...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-slate-900">Gift of Time Admin</h1>
            {loading && <span className="text-sm text-slate-500">Loading...</span>}
          </div>
          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            <button
              onClick={() => setActiveTab("clients")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "clients"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Clients ({clients.length})
            </button>
            <button
              onClick={() => setActiveTab("gifts")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "gifts"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Gifts ({gifts.length})
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "clients" && (
          <div className="space-y-6">
            {/* Create Client Form */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Create New Client</h2>
              </div>
              <form className="p-6" onSubmit={handleCreateClient}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <input
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="First name"
                    value={clientForm.firstName}
                    onChange={(e) => setClientForm((p) => ({ ...p, firstName: e.target.value }))}
                    required
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Last name"
                    value={clientForm.lastName}
                    onChange={(e) => setClientForm((p) => ({ ...p, lastName: e.target.value }))}
                    required
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Company"
                    value={clientForm.companyName}
                    onChange={(e) => setClientForm((p) => ({ ...p, companyName: e.target.value }))}
                    required
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm((p) => ({ ...p, email: e.target.value }))}
                    required
                    type="email"
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-slate-800 transition-colors"
                  >
                    Create Client
                  </button>
                  {createError && <p className="text-sm text-red-600">{createError}</p>}
                  {inviteUrl && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600 font-medium">Created!</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(inviteUrl, "new")}
                        className="text-slate-600 hover:text-slate-900 underline"
                      >
                        {copiedId === "new" ? "Copied!" : "Copy invite link"}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Import/Export */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExport}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                type="button"
              >
                Export CSV
              </button>
              <label className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImport(file)
                    e.target.value = ""
                  }}
                />
                Import CSV
              </label>
              {isImporting && <span className="text-slate-500 text-sm">Importing…</span>}
              {importError && <span className="text-red-600 text-sm">{importError}</span>}
              {importResult && <span className="text-green-600 text-sm">{importResult}</span>}
              {clientError && <span className="text-red-600 text-sm">{clientError}</span>}
            </div>

            {/* Clients Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Invite Link</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {clients.map((client) => {
                      const isEditing = editingClientId === client.id
                      const edit = clientEdits[client.id] || {}
                      const invite = inviteFor(client.token || "")
                      
                      return (
                        <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <input
                                  className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                                  defaultValue={client.firstName}
                                  onChange={(e) =>
                                    setClientEdits((p) => ({ ...p, [client.id]: { ...p[client.id], firstName: e.target.value } }))
                                  }
                                />
                                <input
                                  className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                                  defaultValue={client.lastName}
                                  onChange={(e) =>
                                    setClientEdits((p) => ({ ...p, [client.id]: { ...p[client.id], lastName: e.target.value } }))
                                  }
                                />
                              </div>
                            ) : (
                              <span className="text-sm font-medium text-slate-900">
                                {client.firstName} {client.lastName}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                className="w-32 rounded border border-slate-300 px-2 py-1 text-sm"
                                defaultValue={client.companyName}
                                onChange={(e) =>
                                  setClientEdits((p) => ({ ...p, [client.id]: { ...p[client.id], companyName: e.target.value } }))
                                }
                              />
                            ) : (
                              <span className="text-sm text-slate-600">{client.companyName}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                className="w-48 rounded border border-slate-300 px-2 py-1 text-sm"
                                defaultValue={client.email}
                                onChange={(e) =>
                                  setClientEdits((p) => ({ ...p, [client.id]: { ...p[client.id], email: e.target.value } }))
                                }
                              />
                            ) : (
                              <span className="text-sm text-slate-600">{client.email}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {client.hasSelectedGift ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {client.selectedGiftTitle || "Selected"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCopy(invite, client.id)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {copiedId === client.id ? "Copied!" : "Copy"}
                              </button>
                              <a
                                href={`mailto:${client.email}?subject=Your%20Gift%20of%20Time%20invitation&body=${encodeURIComponent(invite)}`}
                                className="text-sm text-slate-500 hover:text-slate-700"
                              >
                                Email
                              </a>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveClient(client.id)}
                                    disabled={clientSaving[client.id]}
                                    className="text-sm text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                                  >
                                    {clientSaving[client.id] ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingClientId(null)
                                      setClientEdits((p) => {
                                        const { [client.id]: _, ...rest } = p
                                        return rest
                                      })
                                    }}
                                    className="text-sm text-slate-500 hover:text-slate-700"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEditingClientId(client.id)}
                                    className="text-sm text-slate-600 hover:text-slate-900"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClient(client.id)}
                                    disabled={clientDeleting[client.id]}
                                    className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                                  >
                                    {clientDeleting[client.id] ? "..." : "Delete"}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {clients.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                          No clients yet. Create one above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "gifts" && (
          <div className="space-y-6">
            {/* Create Gift Form */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Add New Gift</h2>
              </div>
              <form className="p-6" onSubmit={handleCreateGift}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <input
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Slug (e.g. ai-clinic)"
                    value={giftCreate.slug ?? ""}
                    onChange={(e) => setGiftCreate((p) => ({ ...p, slug: e.target.value }))}
                    required
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Title"
                    value={giftCreate.title ?? ""}
                    onChange={(e) => setGiftCreate((p) => ({ ...p, title: e.target.value }))}
                    required
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Strapline"
                    value={giftCreate.strapline ?? ""}
                    onChange={(e) => setGiftCreate((p) => ({ ...p, strapline: e.target.value }))}
                    required
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Led by name"
                    value={giftCreate.ledByName ?? ""}
                    onChange={(e) => setGiftCreate((p) => ({ ...p, ledByName: e.target.value }))}
                    required
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Led by role"
                    value={giftCreate.ledByRole ?? ""}
                    onChange={(e) => setGiftCreate((p) => ({ ...p, ledByRole: e.target.value }))}
                    required
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Format"
                    value={giftCreate.format ?? ""}
                    onChange={(e) => setGiftCreate((p) => ({ ...p, format: e.target.value }))}
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Duration (e.g. 90 mins, Half day)"
                    value={giftCreate.duration ?? ""}
                    onChange={(e) => setGiftCreate((p) => ({ ...p, duration: e.target.value }))}
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Sort order"
                    type="number"
                    value={giftCreate.sortOrder ?? ""}
                    onChange={(e) => {
                      const val = e.target.value
                      if (!val) {
                        setGiftCreate((p) => {
                          const { sortOrder: _, ...rest } = p
                          return rest
                        })
                      } else {
                        setGiftCreate((p) => ({ ...p, sortOrder: Number(val) }))
                      }
                    }}
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={giftCreate.isActive ?? true}
                      onChange={(e) => setGiftCreate((p) => ({ ...p, isActive: e.target.checked }))}
                      className="rounded border-slate-300"
                    />
                    Active
                  </label>
                </div>
                <div className="mt-4">
                  <textarea
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Description"
                    value={giftCreate.description ?? ""}
                    onChange={(e) => setGiftCreate((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    required
                  />
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-slate-800 transition-colors"
                  >
                    Add Gift
                  </button>
                  {giftCreateError && <p className="text-sm text-red-600">{giftCreateError}</p>}
                </div>
              </form>
            </div>

            {/* Gifts Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Strapline</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Led By</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {giftsSorted.map((gift) => {
                      const isEditing = editingGiftId === gift.id
                      const edit = giftEdits[gift.id] || {}

                      return (
                        <tr key={gift.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
                                type="number"
                                defaultValue={gift.sortOrder ?? 0}
                                onChange={(e) => handleGiftChange(gift.id, "sortOrder", e.target.value)}
                              />
                            ) : (
                              <span className="text-sm text-slate-500">{gift.sortOrder}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                                defaultValue={gift.title}
                                onChange={(e) => handleGiftChange(gift.id, "title", e.target.value)}
                              />
                            ) : (
                              <div>
                                <span className="text-sm font-medium text-slate-900">{gift.title}</span>
                                <p className="text-xs text-slate-500">{gift.slug}</p>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                                defaultValue={gift.strapline}
                                onChange={(e) => handleGiftChange(gift.id, "strapline", e.target.value)}
                              />
                            ) : (
                              <span className="text-sm text-slate-600 line-clamp-2">{gift.strapline}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <div className="space-y-1">
                                <input
                                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                                  defaultValue={gift.ledByName}
                                  onChange={(e) => handleGiftChange(gift.id, "ledByName", e.target.value)}
                                  placeholder="Name"
                                />
                                <input
                                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                                  defaultValue={gift.ledByRole}
                                  onChange={(e) => handleGiftChange(gift.id, "ledByRole", e.target.value)}
                                  placeholder="Role"
                                />
                              </div>
                            ) : (
                              <div>
                                <span className="text-sm text-slate-900">{gift.ledByName}</span>
                                <p className="text-xs text-slate-500">{gift.ledByRole}</p>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={edit.isActive ?? gift.isActive}
                                  onChange={(e) => handleGiftChange(gift.id, "isActive", e.target.checked)}
                                  className="rounded border-slate-300"
                                />
                                Active
                              </label>
                            ) : gift.isActive ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveGift(gift.id)}
                                    disabled={giftSaving[gift.id]}
                                    className="text-sm text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                                  >
                                    {giftSaving[gift.id] ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingGiftId(null)
                                      setGiftEdits((p) => {
                                        const { [gift.id]: _, ...rest } = p
                                        return rest
                                      })
                                    }}
                                    className="text-sm text-slate-500 hover:text-slate-700"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setEditingGiftId(gift.id)}
                                  className="text-sm text-slate-600 hover:text-slate-900"
                                >
                                  Edit
                                </button>
                              )}
                              {giftError[gift.id] && (
                                <span className="text-xs text-red-600">{giftError[gift.id]}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {gifts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                          No gifts yet. Add one above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
