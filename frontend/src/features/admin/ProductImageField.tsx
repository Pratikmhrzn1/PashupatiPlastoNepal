import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { FiAlertCircle, FiLink, FiLoader, FiUpload, FiX } from "react-icons/fi"
import { prepareImageForUpload } from "./image-upload"
import { useUploadProductImage } from "./api"
import { inputClass, labelClass, secondaryButton } from "./ui"

const MAX_IMAGES = 20

interface ProductImageFieldProps {
  value: string[]
  onChange: (images: string[]) => void
  onUploadingChange?: (uploading: boolean) => void
}

export function ProductImageField({ value, onChange, onUploadingChange }: ProductImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const upload = useUploadProductImage()
  const [isUploading, setIsUploading] = useState(false)
  const [activeUpload, setActiveUpload] = useState(0)
  const latestValue = useRef(value)

  useEffect(() => {
    latestValue.current = value
  }, [value])

  const remaining = MAX_IMAGES - value.length

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    if (remaining <= 0) {
      setError(`You can add up to ${MAX_IMAGES} images.`)
      return
    }

    const selected = Array.from(files).slice(0, remaining)
    setError(null)
    setIsUploading(true)
    setActiveUpload(0)
    onUploadingChange?.(true)

    const uploaded: string[] = []

    try {
      for (const file of selected) {
        const data = await prepareImageForUpload(file)
        const result = await upload.mutateAsync(data)
        uploaded.push(result.url)
        setActiveUpload(uploaded.length)
      }

      onChange([...latestValue.current, ...uploaded])
    } catch (cause) {
      if (uploaded.length > 0) {
        onChange([...latestValue.current, ...uploaded])
      }
      setError(cause instanceof Error ? cause.message : "Could not upload the image.")
    } finally {
      setIsUploading(false)
      setActiveUpload(0)
      onUploadingChange?.(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const addUrl = () => {
    const next = url.trim()
    if (!next) return

    if (value.includes(next)) {
      setError("That image is already in the list.")
      return
    }

    if (value.length >= MAX_IMAGES) {
      setError(`You can add up to ${MAX_IMAGES} images.`)
      return
    }

    setError(null)
    onChange([...value, next])
    setUrl("")
  }

  const removeAt = (index: number) => {
    setError(null)
    onChange(value.filter((_, current) => current !== index))
  }

  return (
    <div>
      <span className={labelClass}>Images</span>
      <p className="mt-1 text-xs text-ink-muted">
        Upload from your device or paste a URL. The first image is the primary photo.
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
        <AnimatePresence initial={false}>
          {value.map((image, index) => (
            <motion.div
              key={`${image}-${index}`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="group relative aspect-square overflow-hidden rounded-xl border border-charcoal-800/10 bg-charcoal-100 dark:border-white/10 dark:bg-white/5"
            >
              <img
                src={image}
                alt={`Product image ${index + 1}`}
                className="h-full w-full object-cover"
              />
              {index === 0 && (
                <span className="absolute inset-x-1.5 bottom-1.5 rounded-full bg-charcoal-950/70 px-2 py-0.5 text-center text-[10px] font-semibold tracking-wide text-white backdrop-blur">
                  Primary
                </span>
              )}
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label={`Remove image ${index + 1}`}
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-charcoal-950/65 text-white opacity-100 backdrop-blur transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              >
                <FiX aria-hidden="true" className="text-sm" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-charcoal-800/20 bg-surface/50 text-xs font-semibold text-ink-muted transition hover:border-primary-600/40 hover:bg-primary-50/50 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/[0.02] dark:hover:border-primary-400/40 dark:hover:bg-primary-500/10 dark:hover:text-primary-300"
          >
            {isUploading ? (
              <FiLoader className="animate-spin text-lg" aria-hidden="true" />
            ) : (
              <FiUpload className="text-lg" aria-hidden="true" />
            )}
            <span>
              {isUploading
                ? `Uploading ${activeUpload + 1}…`
                : value.length === 0
                  ? "Add image"
                  : "Add more"}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/*"
        multiple
        tabIndex={-1}
        className="sr-only"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <FiLink
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                addUrl()
              }
            }}
            placeholder="Or paste an image URL"
            aria-label="Image URL"
            className={`${inputClass} mt-0 pl-10`}
          />
        </div>
        <button
          type="button"
          onClick={addUrl}
          disabled={!url.trim()}
          className={`${secondaryButton} shrink-0`}
        >
          Add
        </button>
      </div>

      <p className="mt-2 text-xs text-ink-muted">
        PNG, JPEG or WebP. Large photos are resized automatically before upload.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
        >
          <FiAlertCircle aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  )
}
