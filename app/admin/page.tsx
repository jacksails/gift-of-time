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
    const body = await res.json().catch(() => ({}))
    throw new Error((body as any).error || "SERVER_ERROR")
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
          durationMinutes:
            typeof edit.durationMinutes === "string" ? Number(edit.durationMinutes) || null : edit.durationMinutes,
          sortOrder: typeof edit.sortOrder === "string" ? Number(edit.sortOrder) || 0 : edit.sortOrder,
        }),
      })
      setGifts((prev) => prev.map((g) => (g.id === id ? updated : g)))
      setGiftEdits((prev) => {
        const { [id]: _, ...rest } = prev
        return rest
      })
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
          durationMinutes:
            typeof giftCreate.durationMinutes === "string"
              ? Number(giftCreate.durationMinutes) || null
              : giftCreate.durationMinutes,
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

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
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

  if (authed === false) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <h1 className="text-2xl font-semibold mb-4">Admin Login</h1>
        <form className="space-y-4" onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
          {authError && <p className="text-sm text-red-600">{authError}</p>}
          <button type="submit" className="rounded bg-black text-white px-4 py-2">
            Log in
          </button>
        </form>
      </div>
    )
  }

  if (authed === null) {
    return <div className="p-6">Checking session...</div>
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Gift of Time Admin</h1>
        <p className="text-sm text-gray-600">Create client invites, manage selections, and edit gifts.</p>
        {loading && <p className="text-sm text-gray-600">Loading...</p>}
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4 p-6 rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">Create Client Link</h2>
            {inviteUrl && (
              <button
                type="button"
                className="text-sm text-blue-600 underline"
                onClick={() => handleCopy(inviteUrl)}
              >
                Copy latest invite
              </button>
            )}
          </div>
          <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleCreateClient}>
            <input
              className="rounded border px-3 py-2"
              placeholder="First name"
              value={clientForm.firstName}
              onChange={(e) => setClientForm((p) => ({ ...p, firstName: e.target.value }))}
              required
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Last name"
              value={clientForm.lastName}
              onChange={(e) => setClientForm((p) => ({ ...p, lastName: e.target.value }))}
              required
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Company"
              value={clientForm.companyName}
              onChange={(e) => setClientForm((p) => ({ ...p, companyName: e.target.value }))}
              required
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Email"
              value={clientForm.email}
              onChange={(e) => setClientForm((p) => ({ ...p, email: e.target.value }))}
              required
              type="email"
            />
            <div className="sm:col-span-2 flex items-center gap-3">
              <button type="submit" className="rounded bg-black text-white px-4 py-2">
                Create link
              </button>
              {createError && <p className="text-sm text-red-600">{createError}</p>}
              {inviteUrl && (
                <p className="text-sm truncate">
                  Invite URL:{" "}
                  <a className="text-blue-600 underline" href={inviteUrl}>
                    {inviteUrl}
                  </a>
                </p>
              )}
            </div>
          </form>
        </section>

        <section className="space-y-4 p-6 rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Import / Export</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExport}
              className="rounded border px-3 py-2 hover:bg-gray-50"
              type="button"
            >
              Export CSV
            </button>
            <label className="rounded border px-3 py-2 hover:bg-gray-50 cursor-pointer">
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
            {isImporting && <span className="text-gray-600 text-sm">Importing…</span>}
            {importError && <span className="text-red-600 text-sm">{importError}</span>}
            {importResult && <span className="text-green-700 text-sm">{importResult}</span>}
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold">Clients</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {clientError && <span className="text-red-600">{clientError}</span>}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {clients.map((client) => {
            const edit = clientEdits[client.id] || {}
            const invite = inviteFor(client.token as any || "")
            return (
              <div key={client.id} className="p-4 rounded-xl border bg-white shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2 w-full">
                    <div className="flex flex-wrap gap-2">
                      <input
                        className="rounded border px-3 py-2 w-40"
                        defaultValue={client.firstName}
                        onChange={(e) =>
                          setClientEdits((p) => ({ ...p, [client.id]: { ...p[client.id], firstName: e.target.value } }))
                        }
                      />
                      <input
                        className="rounded border px-3 py-2 w-40"
                        defaultValue={client.lastName}
                        onChange={(e) =>
                          setClientEdits((p) => ({ ...p, [client.id]: { ...p[client.id], lastName: e.target.value } }))
                        }
                      />
                      <input
                        className="rounded border px-3 py-2 w-60"
                        defaultValue={client.companyName}
                        onChange={(e) =>
                          setClientEdits((p) => ({
                            ...p,
                            [client.id]: { ...p[client.id], companyName: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <input
                      className="rounded border px-3 py-2 w-full"
                      defaultValue={client.email}
                      onChange={(e) =>
                        setClientEdits((p) => ({ ...p, [client.id]: { ...p[client.id], email: e.target.value } }))
                      }
                    />
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="truncate">{invite}</span>
                      <button
                        type="button"
                        className="text-blue-600 underline"
                        onClick={() => handleCopy(invite)}
                      >
                        Copy
                      </button>
                      <a
                        className="text-blue-600 underline"
                        href={`mailto:${client.email}?subject=Your%20Gift%20of%20Time%20invitation&body=${encodeURIComponent(invite)}`}
                      >
                        Email
                      </a>
                    </div>
                  </div>
                  <div className="text-sm text-right min-w-[180px]">
                    {client.hasSelectedGift ? (
                      <span className="text-green-700">
                        Selected: {client.selectedGiftTitle || client.selectedGiftId}{" "}
                        {client.selectedAt ? `at ${new Date(client.selectedAt).toLocaleString()}` : ""}
                      </span>
                    ) : (
                      <span className="text-gray-600">No selection yet</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <button
                    className="rounded border px-3 py-2 hover:bg-gray-50"
                    onClick={() => handleSaveClient(client.id)}
                    disabled={clientSaving[client.id]}
                  >
                    {clientSaving[client.id] ? "Saving…" : "Save"}
                  </button>
                  <button
                    className="rounded border px-3 py-2 hover:bg-gray-50 text-red-600"
                    onClick={() => handleDeleteClient(client.id)}
                    disabled={clientDeleting[client.id]}
                  >
                    {clientDeleting[client.id] ? "Deleting…" : "Delete"}
                  </button>
                  <button
                    className="rounded border px-3 py-2 hover:bg-gray-50"
                    onClick={() => handleCopy(invite)}
                  >
                    Copy invite link
                  </button>
                </div>
              </div>
            )
          })}
          {clients.length === 0 && <div className="p-4 text-sm text-gray-600">No clients yet.</div>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Gifts</h2>
        <div className="rounded border p-4 space-y-3">
          <h3 className="font-semibold">Add Gift</h3>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={handleCreateGift}>
            <input
              className="rounded border px-3 py-2"
              placeholder="Slug"
              value={giftCreate.slug ?? ""}
              onChange={(e) => setGiftCreate((p) => ({ ...p, slug: e.target.value }))}
              required
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Title"
              value={giftCreate.title ?? ""}
              onChange={(e) => setGiftCreate((p) => ({ ...p, title: e.target.value }))}
              required
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Strapline"
              value={giftCreate.strapline ?? ""}
              onChange={(e) => setGiftCreate((p) => ({ ...p, strapline: e.target.value }))}
              required
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Led by name"
              value={giftCreate.ledByName ?? ""}
              onChange={(e) => setGiftCreate((p) => ({ ...p, ledByName: e.target.value }))}
              required
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Led by role"
              value={giftCreate.ledByRole ?? ""}
              onChange={(e) => setGiftCreate((p) => ({ ...p, ledByRole: e.target.value }))}
              required
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Format"
              value={giftCreate.format ?? ""}
              onChange={(e) => setGiftCreate((p) => ({ ...p, format: e.target.value }))}
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Duration (minutes)"
              value={giftCreate.durationMinutes ?? ""}
              onChange={(e) =>
                setGiftCreate((p) => {
                  const val = e.target.value
                  if (!val) {
                    const { durationMinutes, ...rest } = p
                    return rest
                  }
                  const num = Number(val)
                  if (Number.isNaN(num)) {
                    return p
                  }
                  return { ...p, durationMinutes: num }
                })
              }
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Sort order"
              value={giftCreate.sortOrder ?? ""}
              onChange={(e) =>
                setGiftCreate((p) => {
                  const val = e.target.value
                  if (!val) {
                    const { sortOrder, ...rest } = p
                    return rest
                  }
                  const num = Number(val)
                  if (Number.isNaN(num)) {
                    return p
                  }
                  return { ...p, sortOrder: num }
                })
              }
            />
            <textarea
              className="rounded border px-3 py-2 md:col-span-2"
              placeholder="Description"
              value={giftCreate.description ?? ""}
              onChange={(e) => setGiftCreate((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              required
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={giftCreate.isActive ?? true}
                onChange={(e) => setGiftCreate((p) => ({ ...p, isActive: e.target.checked }))}
              />
              Active
            </label>
            <div className="md:col-span-2 flex items-center gap-3">
              <button type="submit" className="rounded bg-black text-white px-4 py-2">
                Add gift
              </button>
              {giftCreateError && <p className="text-sm text-red-600">{giftCreateError}</p>}
            </div>
          </form>
        </div>
        <div className="space-y-4">
          {giftsSorted.map((gift) => {
            const edit = giftEdits[gift.id] || {}
            return (
              <div key={gift.id} className="rounded border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{gift.title}</p>
                    <p className="text-sm text-gray-600">Slug: {gift.slug}</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={edit.isActive ?? gift.isActive}
                      onChange={(e) => handleGiftChange(gift.id, "isActive", e.target.checked)}
                    />
                    Active
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="rounded border px-3 py-2"
                    defaultValue={gift.title}
                    onChange={(e) => handleGiftChange(gift.id, "title", e.target.value)}
                    placeholder="Title"
                  />
                  <input
                    className="rounded border px-3 py-2"
                    defaultValue={gift.strapline}
                    onChange={(e) => handleGiftChange(gift.id, "strapline", e.target.value)}
                    placeholder="Strapline"
                  />
                  <input
                    className="rounded border px-3 py-2"
                    defaultValue={gift.ledByName}
                    onChange={(e) => handleGiftChange(gift.id, "ledByName", e.target.value)}
                    placeholder="Led by name"
                  />
                  <input
                    className="rounded border px-3 py-2"
                    defaultValue={gift.ledByRole}
                    onChange={(e) => handleGiftChange(gift.id, "ledByRole", e.target.value)}
                    placeholder="Led by role"
                  />
                  <input
                    className="rounded border px-3 py-2"
                    defaultValue={gift.format ?? ""}
                    onChange={(e) => handleGiftChange(gift.id, "format", e.target.value)}
                    placeholder="Format"
                  />
                  <input
                    className="rounded border px-3 py-2"
                    defaultValue={gift.durationMinutes ?? ""}
                    onChange={(e) => handleGiftChange(gift.id, "durationMinutes", e.target.value)}
                    placeholder="Duration (minutes)"
                  />
                  <input
                    className="rounded border px-3 py-2"
                    defaultValue={gift.sortOrder ?? 0}
                    onChange={(e) => handleGiftChange(gift.id, "sortOrder", e.target.value)}
                    placeholder="Sort order"
                  />
                  <textarea
                    className="rounded border px-3 py-2 md:col-span-2"
                    defaultValue={gift.description}
                    onChange={(e) => handleGiftChange(gift.id, "description", e.target.value)}
                    placeholder="Description"
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="rounded bg-black text-white px-4 py-2"
                    onClick={() => handleSaveGift(gift.id)}
                    disabled={giftSaving[gift.id]}
                  >
                    {giftSaving[gift.id] ? "Saving..." : "Save"}
                  </button>
                  {giftError[gift.id] && <p className="text-sm text-red-600">{giftError[gift.id]}</p>}
                </div>
              </div>
            )
          })}
          {gifts.length === 0 && <div className="text-sm text-gray-600">No gifts found.</div>}
        </div>
      </section>
    </div>
  )
}

