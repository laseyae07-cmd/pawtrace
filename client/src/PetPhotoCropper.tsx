
import { useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import {
    Minus,
    Plus,
    X,
    Check,
    Image as ImageIcon,
} from 'lucide-react'

type PetPhotoCropperProps = {
    file: File
    onSave: (croppedFile: File) => void
    onCancel: () => void
}

const MAX_PHOTO_SIZE = 5 * 1024 * 1024

const aspectOptions = [
    { label: 'Square', value: 1 },
    { label: 'Landscape', value: 4 / 3 },
    { label: 'Portrait', value: 3 / 4 },
]

export default function PetPhotoCropper({
    file,
    onSave,
    onCancel,
}: PetPhotoCropperProps) {
    const [imageUrl, setImageUrl] = useState('')
    const [loadError, setLoadError] = useState('')

    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [aspect, setAspect] = useState(4 / 3)

    const [croppedAreaPixels, setCroppedAreaPixels] =
        useState<Area | null>(null)

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // Read the original image safely.
    // FileReader avoids temporary blob URL issues.
    useEffect(() => {
        const reader = new FileReader()

        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setImageUrl(reader.result)
            } else {
                setLoadError('Unable to read this image.')
            }
        }

        reader.onerror = () => {
            setLoadError('Failed to load the selected photo.')
        }

        reader.readAsDataURL(file)

        return () => {
            reader.onload = null
            reader.onerror = null

            if (reader.readyState === FileReader.LOADING) {
                reader.abort()
            }
        }
    }, [file])

    // Save the cropped image.
    async function saveCroppedPhoto() {
        if (!imageUrl || !croppedAreaPixels) {
            setError('The photo is not ready yet.')
            return
        }

        setSaving(true)
        setError('')

        try {
            const image = new Image()
            image.src = imageUrl

            await image.decode()

            const area = croppedAreaPixels

            if (area.width <= 0 || area.height <= 0) {
                throw new Error('Invalid crop area.')
            }

            const scale = Math.min(
                1,
                1400 / area.width
            )

            const canvas = document.createElement('canvas')

            canvas.width = Math.max(
                1,
                Math.round(area.width * scale)
            )

            canvas.height = Math.max(
                1,
                Math.round(area.height * scale)
            )

            const context = canvas.getContext('2d')

            if (!context) {
                throw new Error(
                    'Unable to create the cropped image.'
                )
            }

            context.fillStyle = '#ffffff'
            context.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            )

            context.imageSmoothingEnabled = true
            context.imageSmoothingQuality = 'high'

            context.drawImage(
                image,
                area.x,
                area.y,
                area.width,
                area.height,
                0,
                0,
                canvas.width,
                canvas.height
            )

            const blob = await new Promise<Blob>(
                (resolve, reject) => {
                    canvas.toBlob(
                        (result) => {
                            if (result) {
                                resolve(result)
                            } else {
                                reject(
                                    new Error('Could not save the image.')
                                )
                            }
                        },
                        'image/jpeg',
                        0.9
                    )
                }
            )

            if (blob.size > MAX_PHOTO_SIZE) {
                throw new Error(
                    'The cropped photo must be 5 MB or smaller.'
                )
            }

            const nameWithoutExtension = file.name.replace(
                /\.[^.]+$/,
                ''
            )

            const croppedFile = new File(
                [blob],
                `${nameWithoutExtension}-cropped.jpg`,
                {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                }
            )

            onSave(croppedFile)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to crop the image.'
            )
        } finally {
            setSaving(false)
        }
    }

    function resetCrop() {
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setError('')
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crop-photo-title"
        >
            <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#151817] text-white shadow-2xl">

                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-5 sm:px-7">
                    <div>
                        <h2
                            id="crop-photo-title"
                            className="flex items-center gap-2 text-xl font-black"
                        >
                            <ImageIcon
                                size={21}
                                className="text-[#c9fa67]"
                            />
                            Edit pet photo
                        </h2>

                        <p className="mt-1 text-xs text-white/45">
                            Drag to reposition. Zoom to adjust.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={saving}
                        aria-label="Close photo editor"
                        className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="min-h-0 overflow-y-auto">

                    {/* Image crop area */}
                    <div className="relative h-64 w-full bg-[#090b0b] sm:h-80">

                        {loadError ? (
                            <div className="flex h-full items-center justify-center p-6 text-center text-red-300">
                                {loadError}
                            </div>
                        ) : imageUrl ? (
                            <Cropper
                                image={imageUrl}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspect}
                                minZoom={1}
                                maxZoom={4}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropAreaChange={(_, pixels) => {
                                    setCroppedAreaPixels(pixels)
                                }}
                                showGrid
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-white/50">
                                Loading photo...
                            </div>
                        )}

                    </div>

                    {/* Editor controls */}
                    <div className="space-y-6 p-5 sm:p-7">

                        {/* Crop shape */}
                        <div>
                            <p className="mb-3 text-sm font-semibold">
                                Crop shape
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {aspectOptions.map((option) => (
                                    <button
                                        key={option.label}
                                        type="button"
                                        onClick={() => {
                                            setAspect(option.value)
                                            setCrop({ x: 0, y: 0 })
                                            setZoom(1)
                                            setCroppedAreaPixels(null)
                                        }}
                                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${aspect === option.value
                                                ? 'bg-[#c9fa67] text-black'
                                                : 'border border-white/15 text-white/65 hover:border-[#c9fa67]'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Zoom */}
                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <label
                                    htmlFor="pet-crop-zoom"
                                    className="text-sm font-semibold"
                                >
                                    Zoom
                                </label>

                                <span className="text-xs text-[#c9fa67]">
                                    {zoom.toFixed(1)}x
                                </span>
                            </div>

                            <div className="flex items-center gap-4">
                                <Minus
                                    size={18}
                                    className="shrink-0 text-white/50"
                                />

                                <input
                                    id="pet-crop-zoom"
                                    type="range"
                                    min={1}
                                    max={4}
                                    step={0.05}
                                    value={zoom}
                                    onChange={(event) => {
                                        setZoom(Number(event.target.value))
                                    }}
                                    className="w-full cursor-pointer accent-[#c9fa67]"
                                />

                                <Plus
                                    size={18}
                                    className="shrink-0 text-white/50"
                                />
                            </div>
                        </div>

                        {/* Reset */}
                        <button
                            type="button"
                            onClick={resetCrop}
                            className="text-sm font-medium text-[#c9fa67] hover:underline"
                        >
                            Reset position and zoom
                        </button>

                        {/* Error */}
                        {error && (
                            <p
                                role="alert"
                                className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300"
                            >
                                {error}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">

                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={saving}
                                className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/75 disabled:opacity-40"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => onSave(file)}
                                disabled={saving}
                                className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/75 disabled:opacity-40"
                            >
                                Keep original
                            </button>

                            <button
                                type="button"
                                onClick={saveCroppedPhoto}
                                disabled={
                                    saving ||
                                    !imageUrl ||
                                    !croppedAreaPixels ||
                                    Boolean(loadError)
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-[#c9fa67] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#d9ff92] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Check size={18} />
                                {saving ? 'Saving...' : 'Save crop'}
                            </button>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
