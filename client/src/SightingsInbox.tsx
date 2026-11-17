import { useEffect, useState } from 'react'
import {
    Bell,
    Check,
    Clock3,
    MapPin,
    RefreshCw,
} from 'lucide-react'

type SightingNotification = {
    id: number | string
    report_id: number | string
    pet_name: string
    location: string
    seen_at: string
    description: string
    is_read: boolean
    created_at: string
}

type InboxFilter = 'all' | 'unread'

const API_BASE_URL = 'http://localhost:5000'

function formatDate(value: string) {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
        ? 'Date unavailable'
        : date.toLocaleString()
}

async function getError(response: Response, fallback: string) {
    try {
        const body: { error?: string } = await response.json()
        return body.error || fallback
    } catch {
        return fallback
    }
}

export default function SightingsInbox() {
    const [notifications, setNotifications] = useState<SightingNotification[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [actionError, setActionError] = useState('')
    const [filter, setFilter] = useState<InboxFilter>('all')
    const [refreshKey, setRefreshKey] = useState(0)
    const [markingId, setMarkingId] = useState<string | null>(null)

    useEffect(() => {
        const controller = new AbortController()

        async function loadNotifications() {
            setLoading(true)
            setError('')

            try {
                const response = await fetch(`${API_BASE_URL}/api/sightings/mine`, {
                    credentials: 'include',
                    signal: controller.signal,
                })

                if (!response.ok) {
                    throw new Error(
                        await getError(
                            response,
                            response.status === 401
                                ? 'Your session expired. Please log in again.'
                                : 'Unable to load sightings.'
                        )
                    )
                }

                const data: SightingNotification[] = await response.json()

                if (!controller.signal.aborted) {
                    setNotifications(data)
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError(
                        err instanceof Error ? err.message : 'Unable to load sightings.'
                    )
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        }

        void loadNotifications()
        return () => controller.abort()
    }, [refreshKey])

    function refresh() {
        setActionError('')
        setRefreshKey((previous) => previous + 1)
    }

    async function markAsRead(id: string) {
        if (markingId !== null) return

        setMarkingId(id)
        setActionError('')

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/sightings/${encodeURIComponent(id)}/read`,
                {
                    method: 'PATCH',
                    credentials: 'include',
                }
            )

            if (!response.ok) {
                throw new Error(
                    await getError(response, 'Could not mark the sighting as read.')
                )
            }

            setNotifications((previous) =>
                previous.map((item) =>
                    String(item.id) === id ? { ...item, is_read: true } : item
                )
            )
        } catch (err) {
            setActionError(
                err instanceof Error ? err.message : 'Could not update the sighting.'
            )
        } finally {
            setMarkingId(null)
        }
    }

    const unreadCount = notifications.filter((item) => !item.is_read).length
    const visibleNotifications =
        filter === 'unread'
            ? notifications.filter((item) => !item.is_read)
            : notifications

    return (
        <section
            aria-labelledby="sightings-inbox-title"
            className="mt-10 rounded-3xl border border-white/10 bg-[#151817] p-5 sm:p-7"
        >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Bell size={23} className="text-[#c9fa67]" />
                        <h2 id="sightings-inbox-title" className="text-xl font-black sm:text-2xl">
                            Pet Sighting Inbox
                        </h2>
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-[#c9fa67] px-2.5 py-1 text-xs font-bold text-black">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
                        See where people spotted your lost pets. Sighting details are private
                        to the pet report owner.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={refresh}
                    disabled={loading}
                    className="inline-flex items-center gap-2 self-start rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/75 hover:border-[#c9fa67] hover:text-[#c9fa67] disabled:opacity-50"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filter sightings">
                <button
                    type="button"
                    onClick={() => setFilter('all')}
                    aria-pressed={filter === 'all'}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === 'all'
                            ? 'bg-[#c9fa67] text-black'
                            : 'border border-white/15 text-white/65 hover:text-white'
                        }`}
                >
                    All ({notifications.length})
                </button>
                <button
                    type="button"
                    onClick={() => setFilter('unread')}
                    aria-pressed={filter === 'unread'}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === 'unread'
                            ? 'bg-[#c9fa67] text-black'
                            : 'border border-white/15 text-white/65 hover:text-white'
                        }`}
                >
                    Unread ({unreadCount})
                </button>
            </div>

            {actionError && (
                <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
                    {actionError}
                </p>
            )}

            {loading ? (
                <div role="status" className="py-12 text-center text-sm text-white/50">
                    Loading your sightings...
                </div>
            ) : error ? (
                <div role="alert" className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-5 text-sm text-red-300">
                    <p>{error}</p>
                    <button type="button" onClick={refresh} className="mt-3 font-semibold underline">
                        Try again
                    </button>
                </div>
            ) : visibleNotifications.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-white/15 px-4 py-12 text-center">
                    <Bell size={30} className="mx-auto text-[#c9fa67]/70" />
                    <p className="mt-3 font-semibold">
                        {filter === 'unread' ? 'You are all caught up!' : 'No sightings reported yet'}
                    </p>
                    <p className="mt-2 text-sm text-white/45">
                        {filter === 'unread'
                            ? 'There are no unread sightings.'
                            : 'When someone reports seeing one of your lost pets, it will appear here.'}
                    </p>
                </div>
            ) : (
                <ul className="mt-6 space-y-3">
                    {visibleNotifications.map((item) => (
                        <li key={String(item.id)}>
                            <article
                                className={`rounded-2xl border p-4 sm:p-5 ${item.is_read
                                        ? 'border-white/10 bg-[#0d100f]'
                                        : 'border-[#c9fa67]/35 bg-[#c9fa67]/5'
                                    }`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-widest text-[#c9fa67]">
                                            {item.is_read ? 'Read sighting' : 'New sighting'}
                                        </p>
                                        <h3 className="mt-2 text-lg font-bold">
                                            {item.pet_name} may have been spotted
                                        </h3>
                                    </div>
                                    <span className="text-xs text-white/40">
                                        Received {formatDate(item.created_at)}
                                    </span>
                                </div>

                                <div className="mt-4 space-y-2 text-sm text-white/70">
                                    <p className="flex items-start gap-2">
                                        <MapPin size={17} className="mt-0.5 shrink-0 text-[#c9fa67]" />
                                        <span>{item.location}</span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <Clock3 size={17} className="mt-0.5 shrink-0 text-[#c9fa67]" />
                                        <span>Seen {formatDate(item.seen_at)}</span>
                                    </p>
                                </div>

                                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-white/65">
                                    {item.description}
                                </p>

                                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                                    <a
                                        href={`/?pet=${encodeURIComponent(String(item.report_id))}`}
                                        className="text-sm font-semibold text-[#c9fa67] hover:underline"
                                    >
                                        View pet report
                                    </a>
                                    {!item.is_read && (
                                        <button
                                            type="button"
                                            disabled={markingId !== null}
                                            onClick={() => void markAsRead(String(item.id))}
                                            className="inline-flex items-center gap-2 rounded-xl border border-[#c9fa67]/40 px-4 py-2.5 text-sm font-semibold text-[#c9fa67] hover:bg-[#c9fa67]/10 disabled:opacity-50"
                                        >
                                            <Check size={16} />
                                            {markingId === String(item.id) ? 'Updating...' : 'Mark as read'}
                                        </button>
                                    )}
                                </div>
                            </article>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
