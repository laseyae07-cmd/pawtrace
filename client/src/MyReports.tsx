
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    MapPin,
    PawPrint,
    Pencil,
    Plus,
    RefreshCw,
    ShieldCheck,
    Trash2,
    X,
} from 'lucide-react'
import { ImagePlus } from 'lucide-react'
import PetPhotoCropper from './PetPhotoCropper'

type MyReport = {
    id: number | string
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

type EditForm = {
    name: string
    type: 'Dog' | 'Cat'
    breed: string
    color: string
    location: string
    status: 'Lost' | 'Found'
    description: string
}

type MyReportsProps = {
    onBack: () => void
    onCreateReport: () => void
}

const API_BASE_URL = 'http://localhost:5000'
const REPORTS_URL = `${API_BASE_URL}/api/reports`

const inputClass =
    'w-full rounded-xl border border-white/10 bg-[#0c0e0d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#c9fa67]/60'

function getImageUrl(imageUrl: string | null) {
    if (!imageUrl) return null

    if (imageUrl.startsWith('http')) {
        return imageUrl
    }

    return `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'
        }${imageUrl}`
}

function createEditForm(report: MyReport): EditForm {
    return {
        name: report.name,
        type: report.animal_type,
        breed: report.breed ?? '',
        color: report.color ?? '',
        location: report.location,
        status: report.status,
        description: report.description,
    }
}

async function readError(
    response: Response,
    fallback: string
) {
    try {
        const data: { error?: string } = await response.json()
        return data.error || fallback
    } catch {
        return fallback
    }
}

export default function MyReports({
    onBack,
    onCreateReport,
}: MyReportsProps) {
    const [reports, setReports] = useState<MyReport[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [refreshKey, setRefreshKey] = useState(0)

    // Edit dialog
    const [editingReport, setEditingReport] =
        useState<MyReport | null>(null)

    const [editForm, setEditForm] =
        useState<EditForm | null>(null)

    const [saving, setSaving] = useState(false)
    const [editError, setEditError] = useState('')

    // Delete dialog
    const [deletingReport, setDeletingReport] =
        useState<MyReport | null>(null)

    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState('')

    const [photoEditor, setPhotoEditor] = useState<{
        reportId: string
        file: File
    } | null>(null)

    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const [photoError, setPhotoError] = useState('')


    // ========================================
    // LOAD USER'S REPORTS
    // ========================================

    useEffect(() => {
        const controller = new AbortController()

        async function loadMyReports() {
            try {
                const response = await fetch(
                    `${REPORTS_URL}/mine`,
                    {
                        credentials: 'include',
                        signal: controller.signal,
                    }
                )

                if (!response.ok) {
                    throw new Error(
                        response.status === 401
                            ? 'Your session has expired. Please log in again.'
                            : 'Unable to load your pet reports.'
                    )
                }

                const data: MyReport[] = await response.json()

                if (!controller.signal.aborted) {
                    setReports(data)
                    setError('')
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Something went wrong.'
                    )
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        }

        void loadMyReports()

        return () => controller.abort()
    }, [refreshKey])

    function refreshReports() {
        setLoading(true)
        setError('')
        setNotice('')
        setRefreshKey((previous) => previous + 1)
    }

    // ========================================
    // EDIT REPORT
    // ========================================

    function openEditDialog(report: MyReport) {
        setEditingReport(report)
        setEditForm(createEditForm(report))
        setEditError('')
        setNotice('')
    }

    function closeEditDialog() {
        if (saving) return

        setEditingReport(null)
        setEditForm(null)
        setEditError('')
    }

    function updateEditForm<K extends keyof EditForm>(
        field: K,
        value: EditForm[K]
    ) {
        setEditForm((previous) =>
            previous
                ? {
                    ...previous,
                    [field]: value,
                }
                : previous
        )
    }

    async function handleSaveEdit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault()

        if (!editingReport || !editForm || saving) {
            return
        }

        setSaving(true)
        setEditError('')

        try {
            const response = await fetch(
                `${REPORTS_URL}/${encodeURIComponent(
                    String(editingReport.id)
                )}`,
                {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: editForm.name.trim(),
                        type: editForm.type,
                        breed: editForm.breed.trim(),
                        color: editForm.color.trim(),
                        location: editForm.location.trim(),
                        status: editForm.status,
                        description: editForm.description.trim(),
                    }),
                }
            )

            if (!response.ok) {
                throw new Error(
                    await readError(
                        response,
                        response.status === 401
                            ? 'Your session has expired. Please log in again.'
                            : 'Unable to update this report.'
                    )
                )
            }

            const data: {
                message: string
                report: MyReport
            } = await response.json()

            if (!data.report) {
                throw new Error(
                    'The server did not return the updated report.'
                )
            }

            // Update the dashboard without reloading.
            setReports((previous) =>
                previous.map((report) =>
                    String(report.id) === String(data.report.id)
                        ? data.report
                        : report
                )
            )

            setEditingReport(null)
            setEditForm(null)
            setNotice('Your pet report was updated successfully.')
        } catch (err) {
            setEditError(
                err instanceof Error
                    ? err.message
                    : 'Failed to save changes.'
            )
        } finally {
            setSaving(false)
        }
    }

    // ========================================
    // DELETE REPORT
    // ========================================

    function openDeleteDialog(report: MyReport) {
        setDeletingReport(report)
        setDeleteError('')
        setNotice('')
    }

    function closeDeleteDialog() {
        if (deleting) return

        setDeletingReport(null)
        setDeleteError('')
    }

    async function handleConfirmDelete() {
        if (!deletingReport || deleting) {
            return
        }

        setDeleting(true)
        setDeleteError('')

        try {
            const response = await fetch(
                `${REPORTS_URL}/${encodeURIComponent(
                    String(deletingReport.id)
                )}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                }
            )

            if (!response.ok) {
                throw new Error(
                    await readError(
                        response,
                        response.status === 401
                            ? 'Your session has expired. Please log in again.'
                            : 'Unable to delete this report.'
                    )
                )
            }

            const deletedId = String(deletingReport.id)

            setReports((previous) =>
                previous.filter(
                    (report) => String(report.id) !== deletedId
                )
            )

            setDeletingReport(null)
            setNotice('Your pet report was deleted successfully.')
        } catch (err) {
            setDeleteError(
                err instanceof Error
                    ? err.message
                    : 'Failed to delete this report.'
            )
        } finally {
            setDeleting(false)
        }
    }

    // ========================================
    // CHANGE REPORT PHOTO
    // ========================================

    function handlePhotoSelection(
        report: MyReport,
        file: File | undefined
    ) {
        if (!file || uploadingPhoto) return

        setPhotoError('')
        setNotice('')

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
        ]

        if (!allowedTypes.includes(file.type)) {
            setPhotoError('Choose a JPG, PNG, or WebP image.')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setPhotoError('The photo must be 5 MB or smaller.')
            return
        }

        setPhotoEditor({
            reportId: String(report.id),
            file,
        })
    }

    async function handlePhotoSaved(file: File) {
        if (!photoEditor || uploadingPhoto) return

        const reportId = photoEditor.reportId

        setPhotoEditor(null)
        setUploadingPhoto(true)
        setPhotoError('')

        try {
            const formData = new FormData()
            formData.append('image', file)

            const response = await fetch(
                `${REPORTS_URL}/${encodeURIComponent(reportId)}/photo`,
                {
                    method: 'PATCH',
                    credentials: 'include',
                    body: formData,
                }
            )

            if (!response.ok) {
                throw new Error(
                    await readError(
                        response,
                        response.status === 401
                            ? 'Your session has expired. Please log in again.'
                            : 'Unable to replace the photo.'
                    )
                )
            }

            const data: {
                message: string
                report: MyReport
            } = await response.json()

            if (!data.report) {
                throw new Error('Invalid response from the server.')
            }

            // Refresh the photo immediately
            setReports((previous) =>
                previous.map((report) =>
                    String(report.id) === reportId
                        ? data.report
                        : report
                )
            )

            setNotice('Pet photo updated successfully!')
        } catch (error) {
            setPhotoError(
                error instanceof Error
                    ? error.message
                    : 'Failed to update the photo.'
            )
        } finally {
            setUploadingPhoto(false)
        }
    }

    // ========================================
    // REPORT STATISTICS
    // ========================================

    const lostCount = reports.filter(
        (report) => report.status === 'Lost'
    ).length

    const foundCount = reports.filter(
        (report) => report.status === 'Found'
    ).length

    return (
        <div className="min-h-screen bg-[#090b0b] text-white">
            {/* ======================================
          HEADER
      ====================================== */}

            <header className="border-b border-white/10 bg-[#090b0b]">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9fa67] text-black">
                            <PawPrint size={23} />
                        </span>

                        <span className="text-xl font-black">
                            PAW
                            <span className="text-[#c9fa67]">
                                TRACE
                            </span>
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold transition hover:border-[#c9fa67] hover:text-[#c9fa67]"
                    >
                        <ArrowLeft size={17} />
                        Back
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
                {/* Page heading */}
                <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#c9fa67]">
                            YOUR PAWTRACE ACTIVITY
                        </p>

                        <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                            My Pet Reports
                            <span className="text-[#c9fa67]">.</span>
                        </h1>

                        <p className="mt-4 max-w-xl text-sm leading-7 text-white/50">
                            View, edit, and manage the lost and found pets
                            you've reported to the community.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onCreateReport}
                        className="inline-flex w-fit items-center gap-2 rounded-full bg-[#c9fa67] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#d9ff92]"
                    >
                        <Plus size={18} />
                        New report
                    </button>
                </div>

                {/* Success message */}
                {notice && (
                    <div
                        role="status"
                        className="mt-7 flex items-center gap-3 rounded-xl border border-[#c9fa67]/20 bg-[#c9fa67]/5 p-4 text-sm text-[#c9fa67]"
                    >
                        <CheckCircle2 size={19} />
                        {notice}
                    </div>
                )}

                {/* Statistics */}
                <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-5">
                    <div className="rounded-2xl border border-white/10 bg-[#151817] p-4 sm:p-6">
                        <p className="text-2xl font-black sm:text-4xl">
                            {reports.length}
                        </p>

                        <p className="mt-2 text-xs text-white/45 sm:text-sm">
                            Total reports
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#151817] p-4 sm:p-6">
                        <p className="text-2xl font-black text-[#c9fa67] sm:text-4xl">
                            {lostCount}
                        </p>

                        <p className="mt-2 text-xs text-white/45 sm:text-sm">
                            Lost pets
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#151817] p-4 sm:p-6">
                        <p className="text-2xl font-black sm:text-4xl">
                            {foundCount}
                        </p>

                        <p className="mt-2 text-xs text-white/45 sm:text-sm">
                            Found pets
                        </p>
                    </div>
                </div>

                {/* ======================================
            YOUR SUBMISSIONS
        ====================================== */}

                <section className="mt-12">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-xl font-bold sm:text-2xl">
                            Your submissions
                        </h2>

                        <button
                            type="button"
                            onClick={refreshReports}
                            disabled={loading}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#c9fa67] disabled:opacity-50"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="mt-8 rounded-2xl border border-white/10 p-16 text-center">
                            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-[#c9fa67]" />

                            <p className="mt-4 text-sm text-white/50">
                                Loading your reports...
                            </p>
                        </div>
                    ) : error ? (
                        <div
                            role="alert"
                            className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/5 p-7"
                        >
                            <p className="text-sm text-red-300">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={refreshReports}
                                className="mt-4 text-sm font-semibold text-[#c9fa67]"
                            >
                                Try again
                            </button>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-10 text-center sm:p-16">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c9fa67]/10 text-[#c9fa67]">
                                <PawPrint size={32} />
                            </div>

                            <h3 className="mt-5 text-xl font-bold">
                                No reports yet
                            </h3>

                            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">
                                You haven't submitted any pet reports yet.
                                Create your first report to help a pet find
                                its way home.
                            </p>

                            <button
                                type="button"
                                onClick={onCreateReport}
                                className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#c9fa67] px-6 py-3 font-bold text-black"
                            >
                                Create a report
                                <ArrowRight size={17} />
                            </button>
                        </div>
                    ) : (
                        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {reports.map((report) => {
                                const imageUrl = getImageUrl(report.image_url)

                                return (
                                    <article
                                        key={report.id}
                                        className="overflow-hidden rounded-2xl border border-white/10 bg-[#151817]"
                                    >
                                        {/* Photo */}
                                        <div className="relative flex h-56 items-center justify-center overflow-hidden bg-[#202421]">
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={`${report.name}, ${report.animal_type}`}
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <PawPrint
                                                    size={48}
                                                    className="text-[#c9fa67]/40"
                                                />
                                            )}

                                            <span
                                                className={`absolute left-4 top-4 rounded-full px-3 py-2 text-xs font-bold ${report.status === 'Lost'
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-[#c9fa67] text-black'
                                                    }`}
                                            >
                                                {report.status.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Information */}
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-xl font-bold">
                                                        {report.name}
                                                    </h3>

                                                    <p className="mt-1 text-sm text-white/45">
                                                        {report.breed || report.animal_type}
                                                    </p>
                                                </div>

                                                <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60">
                                                    #{report.id}
                                                </span>
                                            </div>

                                            <div className="mt-5 space-y-3 text-sm text-white/55">
                                                <p className="flex items-start gap-2">
                                                    <MapPin
                                                        size={16}
                                                        className="mt-0.5 shrink-0 text-[#c9fa67]"
                                                    />
                                                    {report.location}
                                                </p>

                                                {report.color && (
                                                    <p>
                                                        <span className="text-white/35">
                                                            Colour:
                                                        </span>{' '}
                                                        {report.color}
                                                    </p>
                                                )}

                                                <p className="line-clamp-3 leading-6">
                                                    {report.description}
                                                </p>
                                            </div>

                                            <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-white/40">
                                                <span className="flex items-center gap-1.5">
                                                    <CalendarDays size={14} />
                                                    {new Date(
                                                        report.created_at
                                                    ).toLocaleDateString()}
                                                </span>

                                                <span className="flex items-center gap-1.5 text-[#c9fa67]">
                                                    <ShieldCheck size={14} />
                                                    Your report
                                                </span>
                                            </div>

                                            {/* Edit and Delete buttons */}
                                            <div className="mt-5 grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditDialog(report)}
                                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#c9fa67]/40 px-4 py-3 text-sm font-semibold text-[#c9fa67] transition hover:bg-[#c9fa67]/10"
                                                >
                                                    <Pencil size={16} />
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => openDeleteDialog(report)}
                                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/30 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/10"
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>

                                                <label
                                                    className={`col-span-2 flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80 transition hover:border-[#c9fa67] hover:text-[#c9fa67] ${uploadingPhoto
                                                        ? 'cursor-not-allowed opacity-50'
                                                        : 'cursor-pointer'
                                                        }`}
                                                >
                                                    <ImagePlus size={17} />
                                                    Change photo

                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/webp"
                                                        disabled={uploadingPhoto}
                                                        className="sr-only"
                                                        onChange={(event) => {
                                                            handlePhotoSelection(
                                                                report,
                                                                event.target.files?.[0]
                                                            )

                                                            event.target.value = ''
                                                        }}
                                                    />
                                                </label>

                                                {uploadingPhoto && (
                                                    <p
                                                        role="status"
                                                        className="mt-5 rounded-xl border border-[#c9fa67]/20 bg-[#c9fa67]/5 p-4 text-sm text-[#c9fa67]"
                                                    >
                                                        Uploading your new pet photo...
                                                    </p>
                                                )}

                                                {photoError && (
                                                    <p
                                                        role="alert"
                                                        className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300"
                                                    >
                                                        {photoError}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                )
                            })}

                            {/* Change Photo - Crop & Zoom */}
                            {photoEditor && (
                                <PetPhotoCropper
                                    file={photoEditor.file}
                                    onSave={(file) => {
                                        void handlePhotoSaved(file)
                                    }}
                                    onCancel={() => setPhotoEditor(null)}
                                />
                            )}
                        </div>
                    )}
                </section>
            </main>

            <footer className="border-t border-white/10 px-5 py-6 text-center text-xs text-white/35">
                PAWTRACE — Helping paws find their way home.
            </footer>

            {/* ======================================
          EDIT REPORT MODAL
      ====================================== */}

            {editingReport && editForm && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="edit-report-title"
                    className="fixed inset-0 z-[100] overflow-y-auto bg-black/85 p-4 sm:p-8"
                >
                    <div className="mx-auto my-4 w-full max-w-xl overflow-hidden rounded-3xl border border-white/15 bg-[#151817] shadow-2xl">
                        <div className="flex items-start justify-between border-b border-white/10 p-5 sm:p-7">
                            <div>
                                <p className="mb-2 text-xs font-bold tracking-widest text-[#c9fa67]">
                                    EDIT REPORT #{editingReport.id}
                                </p>

                                <h2
                                    id="edit-report-title"
                                    className="text-2xl font-black"
                                >
                                    Edit pet report
                                </h2>

                                <p className="mt-2 text-sm text-white/45">
                                    Update the pet information below.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeEditDialog}
                                disabled={saving}
                                aria-label="Close edit dialog"
                                className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-40"
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSaveEdit}
                            className="space-y-5 p-5 sm:p-7"
                        >
                            <div>
                                <label
                                    htmlFor="edit-name"
                                    className="mb-2 block text-sm font-semibold"
                                >
                                    Pet name
                                </label>

                                <input
                                    id="edit-name"
                                    required
                                    maxLength={100}
                                    value={editForm.name}
                                    onChange={(event) =>
                                        updateEditForm('name', event.target.value)
                                    }
                                    className={inputClass}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="edit-type"
                                        className="mb-2 block text-sm font-semibold"
                                    >
                                        Animal type
                                    </label>

                                    <select
                                        id="edit-type"
                                        value={editForm.type}
                                        onChange={(event) =>
                                            updateEditForm(
                                                'type',
                                                event.target.value as EditForm['type']
                                            )
                                        }
                                        className={inputClass}
                                    >
                                        <option value="Dog">Dog</option>
                                        <option value="Cat">Cat</option>
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="edit-status"
                                        className="mb-2 block text-sm font-semibold"
                                    >
                                        Report status
                                    </label>

                                    <select
                                        id="edit-status"
                                        value={editForm.status}
                                        onChange={(event) =>
                                            updateEditForm(
                                                'status',
                                                event.target.value as EditForm['status']
                                            )
                                        }
                                        className={inputClass}
                                    >
                                        <option value="Lost">Lost</option>
                                        <option value="Found">Found</option>
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="edit-breed"
                                        className="mb-2 block text-sm font-semibold"
                                    >
                                        Breed
                                    </label>

                                    <input
                                        id="edit-breed"
                                        maxLength={100}
                                        value={editForm.breed}
                                        onChange={(event) =>
                                            updateEditForm('breed', event.target.value)
                                        }
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="edit-color"
                                        className="mb-2 block text-sm font-semibold"
                                    >
                                        Colour
                                    </label>

                                    <input
                                        id="edit-color"
                                        maxLength={100}
                                        value={editForm.color}
                                        onChange={(event) =>
                                            updateEditForm('color', event.target.value)
                                        }
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="edit-location"
                                    className="mb-2 block text-sm font-semibold"
                                >
                                    Location
                                </label>

                                <input
                                    id="edit-location"
                                    required
                                    maxLength={255}
                                    value={editForm.location}
                                    onChange={(event) =>
                                        updateEditForm('location', event.target.value)
                                    }
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="edit-description"
                                    className="mb-2 block text-sm font-semibold"
                                >
                                    Description
                                </label>

                                <textarea
                                    id="edit-description"
                                    required
                                    maxLength={1000}
                                    rows={4}
                                    value={editForm.description}
                                    onChange={(event) =>
                                        updateEditForm(
                                            'description',
                                            event.target.value
                                        )
                                    }
                                    className={`${inputClass} resize-y`}
                                />

                                <p className="mt-2 text-right text-xs text-white/35">
                                    {editForm.description.length}/1000
                                </p>
                            </div>

                            <p className="text-xs leading-5 text-white/40">
                                The existing pet photo will remain unchanged.
                            </p>

                            {editError && (
                                <p
                                    role="alert"
                                    className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300"
                                >
                                    {editError}
                                </p>
                            )}

                            <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
                                <button
                                    type="button"
                                    onClick={closeEditDialog}
                                    disabled={saving}
                                    className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/70 disabled:opacity-40"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#c9fa67] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#d9ff92] disabled:opacity-50"
                                >
                                    <CheckCircle2 size={17} />
                                    {saving ? 'Saving...' : 'Save changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ======================================
          DELETE CONFIRMATION MODAL
      ====================================== */}

            {deletingReport && (
                <div
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="delete-report-title"
                    aria-describedby="delete-report-description"
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
                >
                    <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#151817] p-6 shadow-2xl sm:p-8">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
                            <AlertTriangle size={28} />
                        </div>

                        <h2
                            id="delete-report-title"
                            className="mt-5 text-2xl font-black"
                        >
                            Delete pet report?
                        </h2>

                        <p
                            id="delete-report-description"
                            className="mt-4 text-sm leading-7 text-white/55"
                        >
                            Are you sure you want to permanently delete
                            the report for{' '}
                            <strong className="text-white">
                                {deletingReport.name}
                            </strong>
                            ?
                            <span className="mt-2 block text-red-300">
                                This action cannot be undone.
                            </span>
                        </p>

                        {deleteError && (
                            <p
                                role="alert"
                                className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300"
                            >
                                {deleteError}
                            </p>
                        )}

                        <div className="mt-7 flex flex-wrap justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeDeleteDialog}
                                disabled={deleting}
                                className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/75 disabled:opacity-40"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
                            >
                                <Trash2 size={17} />
                                {deleting ? 'Deleting...' : 'Delete report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
