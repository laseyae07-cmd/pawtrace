import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  CheckCircle2,
  Heart,
  MapPin,
  Menu,
  PawPrint,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'

type Pet = {
  id: number
  name: string
  type: 'Dog' | 'Cat'
  breed: string
  location: string
  date: string
  status: 'Lost' | 'Found'
  color: string
  image: string
  description: string
}

type DatabaseReport = {
  id: number | string
  name: string
  animal_type: 'Dog' | 'Cat'
  breed: string | null
  location: string
  status: 'Lost' | 'Found'
  color: string | null
  image_url: string | null
  description: string
  created_at: string
}

type ReportForm = {
  name: string
  type: 'Dog' | 'Cat'
  breed: string
  color: string
  location: string
  status: 'Lost' | 'Found'
  description: string
}

const API_URL = 'http://localhost:5000/api/reports'

const dogImage =
  'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85'

const catImage =
  'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=85'

const initialForm: ReportForm = {
  name: '',
  type: 'Dog',
  breed: '',
  color: '',
  location: '',
  status: 'Lost',
  description: '',
}

function formatReport(report: DatabaseReport): Pet {
  return {
    id: Number(report.id),
    name: report.name,
    type: report.animal_type,
    breed: report.breed ?? '',
    location: report.location,
    date: new Date(report.created_at).toLocaleDateString(),
    status: report.status,
    color: report.color ?? '',
    image:
      report.image_url ||
      (report.animal_type === 'Cat' ? catImage : dogImage),
    description: report.description,
  }
}

function App() {
  const [petReports, setPetReports] = useState<Pet[]>([])
  const [loadingReports, setLoadingReports] = useState(true)
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [animalFilter, setAnimalFilter] = useState('All')
  const [savedPets, setSavedPets] = useState<number[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [form, setForm] = useState<ReportForm>({ ...initialForm })

  useEffect(() => {
    let cancelled = false

    async function loadReports() {
      try {
        const response = await fetch(API_URL)

        if (!response.ok) {
          throw new Error('Could not load pet reports.')
        }

        const data: DatabaseReport[] = await response.json()

        if (!cancelled) {
          setPetReports(data.map(formatReport))
          setApiError('')
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Loading reports failed:', error)
          setApiError(
            'Unable to connect to the PAWTRACE server. Make sure your backend is running.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingReports(false)
        }
      }
    }

    loadReports()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredPets = useMemo(() => {
    const searchTerm = query.trim().toLowerCase()

    return petReports.filter((pet) => {
      const matchesSearch = [
        pet.name,
        pet.type,
        pet.breed,
        pet.location,
        pet.color,
        pet.description,
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm)

      const matchesStatus =
        statusFilter === 'All' || pet.status === statusFilter

      const matchesAnimal =
        animalFilter === 'All' || pet.type === animalFilter

      return matchesSearch && matchesStatus && matchesAnimal
    })
  }, [petReports, query, statusFilter, animalFilter])

  function updateForm<K extends keyof ReportForm>(
    field: K,
    value: ReportForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  function toggleSaved(id: number) {
    setSavedPets((previous) =>
      previous.includes(id)
        ? previous.filter((savedId) => savedId !== id)
        : [...previous, id]
    )
  }

  async function handleReportSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setApiError('')
    setFormSuccess(false)
    setSubmitting(true)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          breed: form.breed.trim(),
          color: form.color.trim(),
          location: form.location.trim(),
          status: form.status,
          description: form.description.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit your report.')
      }

      const newPet = formatReport(data as DatabaseReport)

      setPetReports((previous) => [newPet, ...previous])
      setQuery('')
      setStatusFilter('All')
      setAnimalFilter('All')
      setForm({ ...initialForm })
      setFormSuccess(true)

      document.getElementById('reports')?.scrollIntoView({
        behavior: 'smooth',
      })
    } catch (error) {
      console.error('Submitting report failed:', error)

      setApiError(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const lostCount = petReports.filter(
    (pet) => pet.status === 'Lost'
  ).length

  const foundCount = petReports.filter(
    (pet) => pet.status === 'Found'
  ).length

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#090b0b] text-[#f3f3ed]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090b0b]/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a
            href="#home"
            className="flex items-center gap-3"
            aria-label="PAWTRACE home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9fa67] text-black">
              <PawPrint size={23} />
            </span>

            <span className="text-xl font-black tracking-tight">
              PAW<span className="text-[#c9fa67]">TRACE</span>
            </span>
          </a>

          <div className="hidden items-center gap-8 text-sm text-white/65 md:flex">
            <a href="#reports" className="transition hover:text-[#c9fa67]">
              Pet reports
            </a>
            <a href="#how-it-works" className="transition hover:text-[#c9fa67]">
              How it works
            </a>
            <a href="#about" className="transition hover:text-[#c9fa67]">
              About
            </a>
          </div>

          <a
            href="#report"
            className="hidden items-center gap-2 rounded-full bg-[#c9fa67] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#d9ff92] sm:flex"
          >
            <Plus size={17} />
            Report a pet
          </a>

          <button
            type="button"
            className="rounded-lg border border-white/15 p-2 md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-5 text-sm md:hidden">
            <a href="#reports" onClick={() => setMobileMenuOpen(false)}>
              Pet reports
            </a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>
              How it works
            </a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)}>
              About
            </a>
            <a
              href="#report"
              onClick={() => setMobileMenuOpen(false)}
              className="font-bold text-[#c9fa67]"
            >
              + Report a pet
            </a>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section id="home" className="relative">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_30%,rgba(201,250,103,0.09),transparent_45%)]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#c9fa67]/25 bg-[#c9fa67]/5 px-4 py-2 text-xs font-medium text-[#c9fa67]">
                <Sparkles size={14} />
                EVERY LITTLE LIFE MATTERS
              </div>

              <h1 className="max-w-2xl text-5xl font-black leading-[1.06] tracking-tight sm:text-6xl lg:text-7xl">
                Lost doesn't
                <br />
                mean <span className="text-[#c9fa67]">gone.</span>
              </h1>

              <p className="mt-7 max-w-lg text-base leading-7 text-white/55 sm:text-lg">
                A missing pet is more than a missing face. Help families
                reconnect with their best friends, one sighting at a time.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="#reports"
                  className="inline-flex items-center gap-2 rounded-full bg-[#c9fa67] px-6 py-4 font-bold text-black transition hover:scale-[1.02]"
                >
                  Find a pet
                  <ArrowRight size={18} />
                </a>

                <a
                  href="#report"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-4 font-semibold transition hover:border-[#c9fa67]/60"
                >
                  Report a sighting
                  <ArrowDownRight size={18} />
                </a>
              </div>

              <div className="mt-12 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-7">
                <div>
                  <p className="text-2xl font-black">{petReports.length}</p>
                  <p className="mt-1 text-xs text-white/45">Total reports</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#c9fa67]">
                    {lostCount}
                  </p>
                  <p className="mt-1 text-xs text-white/45">Lost pets</p>
                </div>
                <div>
                  <p className="text-2xl font-black">{foundCount}</p>
                  <p className="mt-1 text-xs text-white/45">Found pets</p>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg">
              <div className="absolute -inset-5 rounded-[2rem] bg-[#c9fa67]/5 blur-2xl" />

              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#151817] p-3">
                <img
                  src={dogImage}
                  alt="A friendly golden dog looking toward the camera"
                  className="h-[340px] w-full rounded-[1.25rem] object-cover sm:h-[420px]"
                />

                <div className="absolute left-7 top-7 flex items-center gap-2 rounded-full border border-white/10 bg-black/65 px-4 py-2 text-xs backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-[#c9fa67]" />
                  A community that cares
                </div>

                <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-[#101211]/90 p-5 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c9fa67]/10 text-[#c9fa67]">
                      <Heart size={21} />
                    </span>
                    <div>
                      <p className="font-bold">Every report makes a difference.</p>
                      <p className="mt-1 text-xs text-white/50">
                        Help spread the word in your community.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reports */}
        <section
          id="reports"
          className="scroll-mt-24 border-t border-white/10 bg-[#0d100f] py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-xs font-bold tracking-[0.25em] text-[#c9fa67]">
                  THE COMMUNITY BOARD
                </p>
                <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
                  Pets that need us.
                </h2>
                <p className="mt-4 max-w-xl leading-7 text-white/50">
                  Search reports from the community and help reunite pets with
                  the people who love them.
                </p>
              </div>

              <a
                href="#report"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-[#c9fa67] hover:text-[#c9fa67]"
              >
                <Plus size={17} />
                Add a report
              </a>
            </div>

            {/* Search and filters */}
            <div className="mt-10 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#151817] px-4">
                <Search size={19} className="shrink-0 text-white/40" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, breed, colour or location..."
                  aria-label="Search pet reports"
                  className="min-w-0 flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-white/30"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by report status"
                className="rounded-xl border border-white/10 bg-[#151817] px-4 py-4 text-sm text-white outline-none focus:border-[#c9fa67]"
              >
                <option value="All">All reports</option>
                <option value="Lost">Lost pets</option>
                <option value="Found">Found pets</option>
              </select>

              <select
                value={animalFilter}
                onChange={(event) => setAnimalFilter(event.target.value)}
                aria-label="Filter by animal"
                className="rounded-xl border border-white/10 bg-[#151817] px-4 py-4 text-sm text-white outline-none focus:border-[#c9fa67]"
              >
                <option value="All">All animals</option>
                <option value="Dog">Dogs</option>
                <option value="Cat">Cats</option>
              </select>
            </div>

            {apiError && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm leading-6 text-red-300"
              >
                {apiError}
              </div>
            )}

            {loadingReports ? (
              <div className="py-24 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#c9fa67]" />
                <p className="mt-4 text-sm text-white/50">
                  Loading pet reports...
                </p>
              </div>
            ) : filteredPets.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-white/15 px-5 py-16 text-center">
                <PawPrint
                  size={35}
                  className="mx-auto text-[#c9fa67]/70"
                />
                <h3 className="mt-4 text-xl font-bold">
                  {petReports.length === 0
                    ? 'No reports yet'
                    : 'No matching pets'}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">
                  {petReports.length === 0
                    ? 'Be the first to create a report and help a pet find its way home.'
                    : 'Try another search term or change your filters.'}
                </p>
                {petReports.length === 0 ? (
                  <a
                    href="#report"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#c9fa67] px-5 py-3 text-sm font-bold text-black"
                  >
                    Create the first report
                    <ArrowRight size={16} />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setStatusFilter('All')
                      setAnimalFilter('All')
                    }}
                    className="mt-6 text-sm font-semibold text-[#c9fa67]"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="mt-7 text-sm text-white/40">
                  Showing {filteredPets.length}{' '}
                  {filteredPets.length === 1 ? 'report' : 'reports'}
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredPets.map((pet) => (
                    <article
                      key={pet.id}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#151817] transition duration-300 hover:-translate-y-1 hover:border-[#c9fa67]/30"
                    >
                      <div className="relative h-60 overflow-hidden bg-[#202421]">
                        <img
                          src={pet.image || (pet.type === 'Cat' ? catImage : dogImage)}
                          alt={`${pet.name}, ${pet.type}`}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />

                        <span
                          className={`absolute left-4 top-4 rounded-full px-3 py-2 text-xs font-bold ${
                            pet.status === 'Lost'
                              ? 'bg-red-500/90 text-white'
                              : 'bg-[#c9fa67] text-black'
                          }`}
                        >
                          {pet.status === 'Lost' ? 'LOST PET' : 'FOUND PET'}
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleSaved(pet.id)}
                          aria-label={
                            savedPets.includes(pet.id)
                              ? `Unsave ${pet.name}`
                              : `Save ${pet.name}`
                          }
                          className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/55 p-2.5 backdrop-blur transition hover:bg-black"
                        >
                          <Heart
                            size={18}
                            className={
                              savedPets.includes(pet.id)
                                ? 'fill-[#c9fa67] text-[#c9fa67]'
                                : 'text-white'
                            }
                          />
                        </button>
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-bold">{pet.name}</h3>
                            <p className="mt-1 text-sm text-white/45">
                              {pet.breed || pet.type}
                            </p>
                          </div>

                          <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65">
                            {pet.type}
                          </span>
                        </div>

                        <div className="mt-5 space-y-3 text-sm text-white/55">
                          <p className="flex items-start gap-2">
                            <MapPin
                              size={16}
                              className="mt-0.5 shrink-0 text-[#c9fa67]"
                            />
                            {pet.location}
                          </p>

                          {pet.color && (
                            <p>
                              <span className="text-white/35">Colour:</span>{' '}
                              {pet.color}
                            </p>
                          )}

                          <p className="leading-6">
                            {pet.description}
                          </p>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/40">
                          <span>{pet.date}</span>
                          <span className="inline-flex items-center gap-1.5 text-[#c9fa67]">
                            <ShieldCheck size={15} />
                            Community report
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="scroll-mt-24 border-t border-white/10 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-bold tracking-[0.25em] text-[#c9fa67]">
                SMALL ACTIONS. BIG DIFFERENCE.
              </p>
              <h2 className="text-3xl font-black sm:text-5xl">
                How PAWTRACE works.
              </h2>
              <p className="mt-4 leading-7 text-white/50">
                A simple way for people to share information and help pets get
                back home.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                {
                  number: '01',
                  title: 'Create a report',
                  description:
                    'Share the pet’s details, location and whether it is lost or found.',
                },
                {
                  number: '02',
                  title: 'Spread the word',
                  description:
                    'Let other people search reports and recognise pets in their area.',
                },
                {
                  number: '03',
                  title: 'Help reconnect',
                  description:
                    'Use the shared information to help owners and finders connect safely.',
                },
              ].map((item) => (
                <div
                  key={item.number}
                  className="rounded-2xl border border-white/10 bg-[#111413] p-7"
                >
                  <span className="text-sm font-bold tracking-widest text-[#c9fa67]">
                    {item.number}
                  </span>
                  <h3 className="mt-7 text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/50">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Report form */}
        <section
          id="report"
          className="scroll-mt-24 border-t border-white/10 bg-[#0d100f] py-20 sm:py-24"
        >
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="mb-3 text-xs font-bold tracking-[0.25em] text-[#c9fa67]">
                TAKE THE FIRST STEP
              </p>

              <h2 className="text-3xl font-black leading-tight sm:text-5xl">
                Every detail
                <br />
                <span className="text-[#c9fa67]">could matter.</span>
              </h2>

              <p className="mt-5 max-w-md leading-7 text-white/50">
                Whether a pet is missing or you have found one, share what you
                know. Someone may be looking for them right now.
              </p>

              <div className="mt-8 flex items-start gap-3 rounded-xl border border-[#c9fa67]/15 bg-[#c9fa67]/5 p-4">
                <ShieldCheck
                  size={22}
                  className="mt-0.5 shrink-0 text-[#c9fa67]"
                />
                <p className="text-sm leading-6 text-white/65">
                  Keep your report accurate. Avoid publishing sensitive
                  personal information or your private home address.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleReportSubmit}
              className="rounded-2xl border border-white/10 bg-[#151817] p-5 sm:p-8"
            >
              <div className="mb-7">
                <h3 className="text-xl font-bold">Create a pet report</h3>
                <p className="mt-2 text-sm text-white/45">
                  Complete the details below.
                </p>
              </div>

              {formSuccess && (
                <div
                  role="status"
                  className="mb-6 flex items-start gap-3 rounded-xl border border-[#c9fa67]/20 bg-[#c9fa67]/5 p-4 text-sm leading-6 text-[#c9fa67]"
                >
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
                  Your report was saved successfully!
                </div>
              )}

              {apiError && (
                <div
                  role="alert"
                  className="mb-6 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm leading-6 text-red-300"
                >
                  {apiError}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-2 block font-medium">
                    Pet name <span className="text-[#c9fa67]">*</span>
                  </span>
                  <input
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(event) =>
                      updateForm('name', event.target.value)
                    }
                    placeholder="e.g. Bruno"
                    className="w-full rounded-xl border border-white/10 bg-[#0c0e0d] px-4 py-3.5 outline-none transition placeholder:text-white/25 focus:border-[#c9fa67]/60"
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-2 block font-medium">
                    Report type <span className="text-[#c9fa67]">*</span>
                  </span>
                  <select
                    required
                    value={form.status}
                    onChange={(event) =>
                      updateForm(
                        'status',
                        event.target.value as ReportForm['status']
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0c0e0d] px-4 py-3.5 outline-none focus:border-[#c9fa67]/60"
                  >
                    <option value="Lost">Lost pet</option>
                    <option value="Found">Found pet</option>
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="mb-2 block font-medium">
                    Animal type <span className="text-[#c9fa67]">*</span>
                  </span>
                  <select
                    required
                    value={form.type}
                    onChange={(event) =>
                      updateForm(
                        'type',
                        event.target.value as ReportForm['type']
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#0c0e0d] px-4 py-3.5 outline-none focus:border-[#c9fa67]/60"
                  >
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="mb-2 block font-medium">Breed</span>
                  <input
                    maxLength={100}
                    value={form.breed}
                    onChange={(event) =>
                      updateForm('breed', event.target.value)
                    }
                    placeholder="e.g. Labrador"
                    className="w-full rounded-xl border border-white/10 bg-[#0c0e0d] px-4 py-3.5 outline-none placeholder:text-white/25 focus:border-[#c9fa67]/60"
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-2 block font-medium">Main colour</span>
                  <input
                    maxLength={100}
                    value={form.color}
                    onChange={(event) =>
                      updateForm('color', event.target.value)
                    }
                    placeholder="e.g. Brown and white"
                    className="w-full rounded-xl border border-white/10 bg-[#0c0e0d] px-4 py-3.5 outline-none placeholder:text-white/25 focus:border-[#c9fa67]/60"
                  />
                </label>

                <label className="block text-sm sm:col-span-2">
                  <span className="mb-2 block font-medium">
                    Location <span className="text-[#c9fa67]">*</span>
                  </span>
                  <input
                    required
                    maxLength={255}
                    value={form.location}
                    onChange={(event) =>
                      updateForm('location', event.target.value)
                    }
                    placeholder="e.g. Kandy, near the town centre"
                    className="w-full rounded-xl border border-white/10 bg-[#0c0e0d] px-4 py-3.5 outline-none placeholder:text-white/25 focus:border-[#c9fa67]/60"
                  />
                </label>

                <label className="block text-sm sm:col-span-2">
                  <span className="mb-2 block font-medium">
                    Description <span className="text-[#c9fa67]">*</span>
                  </span>
                  <textarea
                    required
                    minLength={10}
                    maxLength={1000}
                    rows={5}
                    value={form.description}
                    onChange={(event) =>
                      updateForm('description', event.target.value)
                    }
                    placeholder="Describe the pet, when it went missing or where it was found, and any identifying details..."
                    className="w-full resize-y rounded-xl border border-white/10 bg-[#0c0e0d] px-4 py-3.5 leading-6 outline-none placeholder:text-white/25 focus:border-[#c9fa67]/60"
                  />
                  <span className="mt-2 block text-right text-xs text-white/35">
                    {form.description.length}/1000
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c9fa67] px-5 py-4 font-bold text-black transition hover:bg-[#d9ff92] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  'Submitting report...'
                ) : (
                  <>
                    Submit report
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-white/35">
                Your report will be saved to the PAWTRACE database.
              </p>
            </form>
          </div>
        </section>

        {/* About */}
        <section
          id="about"
          className="scroll-mt-24 border-t border-white/10 py-14"
        >
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 sm:px-8 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9fa67] text-black">
                <PawPrint size={22} />
              </span>
              <div>
                <p className="font-black tracking-tight">
                  PAW<span className="text-[#c9fa67]">TRACE</span>
                </p>
                <p className="mt-1 text-xs text-white/40">
                  Helping paws find their way home.
                </p>
              </div>
            </div>

            <p className="max-w-lg text-sm leading-6 text-white/40 md:text-right">
              A community-focused lost and found pet reporting project.
              Always verify a pet's identity and arrange reunions safely.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-5 py-6 text-center text-xs text-white/35">
        © {new Date().getFullYear()} PAWTRACE. Built with care for every paw.
      </footer>
    </div>
  )
}

export default App
