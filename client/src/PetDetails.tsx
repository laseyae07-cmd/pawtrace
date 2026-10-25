import { useEffect, useLayoutEffect, useState } from 'react'
import {
    ArrowLeft,
    CalendarDays,
    MapPin,
    PawPrint,
    ShieldCheck,
} from 'lucide-react'

type Report = {
    id: string
    name: string
    animal_type: 'Dog' | 'Cat'
    breed: string | null
    color: string | null
    location: string
    status: 'Lost' | 'Found'
    description: string
    image_url: string | null
    created_at: string
}

type PetDetailsProps = {
    reportId: string
    onBack: () => void
}

const API_BASE_URL = 'http://localhost:5000'

export default function PetDetails({
    reportId,
    onBack,
}: PetDetailsProps) {
    const [report, setReport] = useState<Report | null>(null)
    const [error, setError] = useState('')

    useLayoutEffect(() => {
        window.scrollTo(0, 0)
    }, [reportId])

    useEffect(() => {
        const controller = new AbortController()

        async function loadReport() {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/reports/${reportId}`,
                    { signal: controller.signal }
                )

                if (!response.ok) {
                    throw new Error(
                        response.status === 404
                            ? 'This pet report could not be found.'
                            : 'Unable to load the pet report.'
                    )
                }

                const data: Report = await response.json()

                if (!controller.signal.aborted) {
                    setReport(data)
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Something went wrong.'
                    )
                }
            }
        }

        loadReport()

        return () => controller.abort()
    }, [reportId])

    const imageUrl = report?.image_url
        ? report.image_url.startsWith('http')
            ? report.image_url
            : `${API_BASE_URL}${report.image_url.startsWith('/') ? '' : '/'
            }${report.image_url}`
        : null

    return (
        <div className="min-h-screen bg-[#090b0b] text-[#f3f3ed]">
            <header className="border-b border-white/10 bg-[#090b0b]">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9fa67] text-black">
                            <PawPrint size={23} />
                        </span>
                        <span className="text-xl font-black">
                            PAW<span className="text-[#c9fa67]">TRACE</span>
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm font-semibold text-white/65 transition hover:text-[#c9fa67]"
                    >
                        <ArrowLeft size={18} />
                        Back to reports
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
                {error ? (
                    <div
                        role="alert"
                        className="rounded-2xl border border-red-400/20 bg-red-400/5 p-10 text-center"
                    >
                        <p className="text-lg text-red-300">{error}</p>

                        <button
                            type="button"
                            onClick={onBack}
                            className="mt-6 rounded-full bg-[#c9fa67] px-6 py-3 font-bold text-black"
                        >
                            Return to reports
                        </button>
                    </div>
                ) : !report ? (
                    <div className="py-28 text-center" role="status">
                        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#c9fa67]" />
                        <p className="mt-5 text-white/50">
                            Loading pet details...
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-10">
                            <p className="mb-3 text-xs font-bold tracking-[0.25em] text-[#c9fa67]">
                                PAWTRACE / COMMUNITY REPORT
                            </p>

                            <div className="flex flex-wrap items-center gap-4">
                                <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
                                    {report.name}
                                    <span className="text-[#c9fa67]">.</span>
                                </h1>

                                <span
                                    className={`rounded-full px-4 py-2 text-xs font-black tracking-wider ${report.status === 'Lost'
                                        ? 'bg-red-500/15 text-red-300'
                                        : 'bg-[#c9fa67]/15 text-[#c9fa67]'
                                        }`}
                                >
                                    {report.status.toUpperCase()} PET
                                </span>
                            </div>

                            <p className="mt-4 text-sm text-white/45">
                                Report #{report.id}
                            </p>
                        </div>

                        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="self-start overflow-hidden rounded-3xl border border-white/10 bg-[#151817]">
                                {imageUrl ? (

                                    <img
                                        src={imageUrl}
                                        alt={`${report.name}, a ${report.animal_type}`}
                                        className="block h-auto w-full"
                                    />

                                ) : (
                                    <div className="flex h-[360px] flex-col items-center justify-center gap-4 bg-[#151817] text-white/30 sm:h-[520px]">
                                        <PawPrint size={70} />
                                        <p>No photograph available</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="rounded-3xl border border-white/10 bg-[#151817] p-6 sm:p-8">
                                    <h2 className="mb-7 text-2xl font-black">
                                        Pet information
                                    </h2>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        {[
                                            {
                                                label: 'Animal',
                                                value: report.animal_type,
                                            },
                                            {
                                                label: 'Breed',
                                                value: report.breed || 'Unknown',
                                            },
                                            {
                                                label: 'Colour',
                                                value: report.color || 'Not specified',
                                            },
                                            {
                                                label: 'Status',
                                                value: report.status,
                                            },
                                        ].map((item) => (
                                            <div key={item.label}>
                                                <p className="text-xs uppercase tracking-wider text-white/40">
                                                    {item.label}
                                                </p>
                                                <p className="mt-2 font-semibold">
                                                    {item.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 border-t border-white/10 pt-6">
                                        <div className="flex items-center gap-2 text-[#c9fa67]">
                                            <MapPin size={19} />
                                            <h3 className="font-bold">
                                                Reported location
                                            </h3>
                                        </div>
                                        <p className="mt-3 text-white/65">
                                            {report.location}
                                        </p>
                                    </div>

                                    <div className="mt-6 border-t border-white/10 pt-6">
                                        <div className="flex items-center gap-2 text-[#c9fa67]">
                                            <CalendarDays size={19} />
                                            <h3 className="font-bold">
                                                Date reported
                                            </h3>
                                        </div>
                                        <p className="mt-3 text-white/65">
                                            {new Date(
                                                report.created_at
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-[#151817] p-6 sm:p-8">
                                    <h2 className="text-xl font-black">
                                        About this pet
                                    </h2>
                                    <p className="mt-4 whitespace-pre-wrap leading-8 text-white/65">
                                        {report.description}
                                    </p>
                                </div>

                                <div className="flex items-start gap-3 rounded-2xl border border-[#c9fa67]/20 bg-[#c9fa67]/5 p-5">
                                    <ShieldCheck
                                        size={21}
                                        className="shrink-0 text-[#c9fa67]"
                                    />
                                    <p className="text-sm leading-6 text-white/60">
                                        This information was submitted as a community
                                        report. Verify details carefully and arrange
                                        pet reunions safely.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onBack}
                            className="mt-12 inline-flex items-center gap-3 rounded-full bg-[#c9fa67] px-7 py-4 font-bold text-black transition hover:bg-[#d9ff92]"
                        >
                            <ArrowLeft size={18} />
                            Back to pet reports
                        </button>
                    </>
                )}
            </main>
        </div>
    )
}
