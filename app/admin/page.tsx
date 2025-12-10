"use client"

import { useEffect, useMemo, useState } from "react"
import type { Gift } from "@/types/gift"

type ClientRow = {
  id: string
  firstName: string
  lastName: string
  companyName: string
  email: string
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

  const [clientForm, setClientForm] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
  })

  const [giftEdits, setGiftEdits] = useState<Record<string, GiftFormState>>({})
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
        {loading && <p className="text-sm text-gray-600">Loading...</p>}
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Create Client Link</h2>
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
              <p className="text-sm">
                Invite URL: <a className="text-blue-600 underline" href={inviteUrl}>{inviteUrl}</a>
              </p>
            )}
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Clients</h2>
        <div className="border rounded divide-y">
          {clients.map((client) => (
            <div key={client.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="font-medium">
                  {client.firstName} {client.lastName} • {client.companyName}
                </p>
                <p className="text-sm text-gray-600">{client.email}</p>
              </div>
              <div className="text-sm">
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
          ))}
          {clients.length === 0 && <div className="p-4 text-sm text-gray-600">No clients yet.</div>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Gifts</h2>
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

