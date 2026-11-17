import { useState } from 'react'
import type { FormEvent } from 'react'
import { Clock3, MapPin, Send, X } from 'lucide-react'

type ReportSightingModalProps = {
    reportId: string
    petName: string
    onClose: () => void
    onSubmitted: () => void
}

const API_BASE_URL = 'http://localhost:5000'

function localDateTimeNow() {
    const now = new Date()
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    return local.toISOString().slice(0, 16)
}

export default function ReportSightingModal({
    reportId,
    petName,
    onClose,
    onSubmitted,
}: ReportSightingModalProps) {
    const [location, setLocation] = useState('')
    const [seenAt, setSeenAt] = useState(localDateTimeNow)
    const [description, setDescription] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (submitting) return

        const cleanLocation = location.trim()
        const cleanDescription = description.trim()
        const seenDate = new Date(seenAt)

        if (!cleanLocation || cleanLocation.length > 255) {
            setError('Enter a location of no more than 255 characters.')
            return
        }

        if (cleanDescription.length < 10 || cleanDescription.length > 1000) {
            setError('The description must be between 10 and 1000 characters.')
            return
        }

        if (Number.isNaN(seenDate.getTime()) || seenDate.getTime() > Date.now()) {
            setError('Choose a valid sighting time that is not in the future.')
            return
        }

        setSubmitting(true)
        setError('')

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/reports/${encodeURIComponent(reportId)}/sightings`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        location: cleanLocation,
                        seen_at: seenDate.toISOString(),
                        description: cleanDescription,
                    }),
                }
            )

            if (!response.ok) {
                let message = 'Unable to submit your sighting. Please try again.'
                try {
                    const data: { error?: string } = await response.json()
                    if (data.error) message = data.error
                } catch {
                    // Keep the fallback message if the server returns non-JSON.
                }

                if (response.status === 401) {
                    message = 'Please log in first. Return to the reports page, log in, and open this pet again.'
                }

                throw new Error(message)
            }

            onSubmitted()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to submit the sighting.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-[110] overflow-y-auto bg-black/85 p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-sighting-title"
        >
            <div className="mx-auto my-5 w-full max-w-xl rounded-3xl border border-white/15 bg-[#151817] p-6 text-white shadow-2xl sm:p-8">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#c9fa67]">
                            Help a pet get home
                        </p>
                        <h2 id="report-sighting-title" className="text-2xl font-black">
                            Report a sighting
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-white/55">
                            Tell the owner where and when you spotted {petName}.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close sighting form"
                        className="rounded-full p-2 text-white/60 hover:bg-white/10 disabled:opacity-50"
                    >
                        <X size={21} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <label className="block text-sm font-semibold">
                        <span className="mb-2 flex items-center gap-2">
                            <MapPin size={17} className="text-[#c9fa67]" />
                            Where did you see the pet?
                        </span>
                        <input
                            required
                            maxLength={255}
                            value={location}
                            onChange={(event) => setLocation(event.target.value)}
                            placeholder="e.g. Near Kandy Lake"
                            className="w-full rounded-xl border border-white/15 bg-[#0c0e0d] px-4 py-3.5 font-normal outline-none focus:border-[#c9fa67]"
                        />
                    </label>

                    <label className="block text-sm font-semibold">
                        <span className="mb-2 flex items-center gap-2">
                            <Clock3 size={17} className="text-[#c9fa67]" />
                            When did you see the pet?
                        </span>
                        <input
                            required
                            type="datetime-local"
                            value={seenAt}
                            max={localDateTimeNow()}
                            onChange={(event) => setSeenAt(event.target.value)}
                            className="w-full rounded-xl border border-white/15 bg-[#0c0e0d] px-4 py-3.5 font-normal outline-none focus:border-[#c9fa67] [color-scheme:dark]"
                        />
                        <span className="mt-2 block text-xs font-normal text-white/40">
                            This uses the time zone on your device.
                        </span>
                    </label>

                    <label className="block text-sm font-semibold">
                        <span className="mb-2 block">What did you notice?</span>
                        <textarea
                            required
                            minLength={10}
                            maxLength={1000}
                            rows={5}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="Describe the pet, direction of travel, collar, or any useful details..."
                            className="w-full resize-y rounded-xl border border-white/15 bg-[#0c0e0d] px-4 py-3.5 font-normal leading-6 outline-none focus:border-[#c9fa67]"
                        />
                        <span className="mt-2 block text-right text-xs font-normal text-white/40">
                            {description.length}/1000
                        </span>
                    </label>

                    <p className="text-xs leading-5 text-white/45">
                        Please share only information relevant to the sighting. Avoid private addresses or contact details. Sightings are visible to the report owner.
                    </p>

                    {error && (
                        <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm leading-6 text-red-300">
                            {error}
                        </p>
                    )}

                    <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/75 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#c9fa67] px-5 py-3 text-sm font-bold text-black hover:bg-[#d9ff92] disabled:opacity-50"
                        >
                            <Send size={17} />
                            {submitting ? 'Sending...' : 'Submit sighting'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
