
import { useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  Bell,
  ChevronDown,
  Crosshair,
  Heart,
  MapPin,
  Menu,
  PawPrint,
  Search,
  ShieldCheck,
  SlidersHorizontal,
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
}

const pets: Pet[] = [
  {
    id: 1,
    name: 'Bruno',
    type: 'Dog',
    breed: 'Mixed breed · Brown & white',
    location: 'Kandy, Sri Lanka',
    date: 'Today',
    status: 'Lost',
    color: 'Brown & white',
    image:
      'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 2,
    name: 'Milo',
    type: 'Cat',
    breed: 'Domestic shorthair · Ginger',
    location: 'Colombo, Sri Lanka',
    date: 'Yesterday',
    status: 'Found',
    color: 'Ginger',
    image:
      'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 3,
    name: 'Rocky',
    type: 'Dog',
    breed: 'Golden retriever',
    location: 'Peradeniya, Sri Lanka',
    date: '2 days ago',
    status: 'Lost',
    color: 'Golden',
    image:
      'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 4,
    name: 'Luna',
    type: 'Cat',
    breed: 'Domestic shorthair · Grey',
    location: 'Gampaha, Sri Lanka',
    date: 'Today',
    status: 'Found',
    color: 'Grey',
    image:
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=85',
  },
]

function App() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [animal, setAnimal] = useState('All')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [saved, setSaved] = useState<number[]>([])

  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      const searchText =
        `${pet.name} ${pet.breed} ${pet.location} ${pet.color}`.toLowerCase()

      return (
        searchText.includes(query.toLowerCase()) &&
        (status === 'All' || pet.status === status) &&
        (animal === 'All' || pet.type === animal)
      )
    })
  }, [query, status, animal])

  function toggleSaved(id: number) {
    setSaved((previous) =>
      previous.includes(id)
        ? previous.filter((savedId) => savedId !== id)
        : [...previous, id],
    )
  }

  return (
    <div className="min-h-screen bg-[#080b10] text-[#f4f7fb]">
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#080b10]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300 text-[#071014]">
              <PawPrint size={23} strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[19px] font-black tracking-[0.17em]">
                PAWTRACE<span className="text-cyan-300">.</span>
              </div>
              <div className="text-[9px] tracking-[0.22em] text-slate-500">
                PET RECOVERY NETWORK
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
            <a href="#reports" className="transition hover:text-cyan-300">
              Find pets
            </a>
            <a href="#how-it-works" className="transition hover:text-cyan-300">
              How it works
            </a>
            <a href="#safety" className="transition hover:text-cyan-300">
              Safety
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={() => document.getElementById('report')?.scrollIntoView({ behavior: 'smooth' })}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 transition hover:border-cyan-300/50"
            >
              Report a pet
            </button>
            <button
              onClick={() => alert('Account registration will be added in the backend phase.')}
              className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-[#071014] transition hover:bg-cyan-200"
            >
              Get started <ArrowRight className="ml-1 inline" size={15} />
            </button>
          </div>

          <button
            className="rounded-lg border border-white/10 p-2 md:hidden"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle navigation"
          >
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>

        {mobileMenu && (
          <nav className="grid gap-4 border-t border-white/10 px-6 py-5 text-sm text-slate-300 md:hidden">
            <a href="#reports" onClick={() => setMobileMenu(false)}>Find pets</a>
            <a href="#how-it-works" onClick={() => setMobileMenu(false)}>How it works</a>
            <a href="#safety" onClick={() => setMobileMenu(false)}>Safety</a>
            <a href="#report" onClick={() => setMobileMenu(false)}>Report a pet</a>
          </nav>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/[0.06]">
          <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-cyan-400/[0.08] blur-[130px]" />
          <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.02fr_0.98fr] lg:px-12 lg:py-28">
            <div className="relative z-10">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3.5 py-2 text-xs font-medium text-cyan-200">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                A smarter way to bring pets home
              </div>

              <h1 className="max-w-[700px] text-5xl leading-[1.06] font-semibold tracking-[-0.055em] sm:text-6xl lg:text-[76px]">
                Lost doesn't
                <br />
                mean <span className="text-cyan-300">gone.</span>
              </h1>

              <p className="mt-7 max-w-lg text-base leading-8 text-slate-400 sm:text-lg">
                Every sighting matters. Connect lost pets, nearby sightings,
                and caring people through one intelligent recovery network.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#reports"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-6 py-3.5 font-bold text-[#071014] transition hover:-translate-y-0.5 hover:bg-cyan-200"
                >
                  Find a pet <ArrowRight size={18} />
                </a>
                <a
                  href="#report"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 font-medium transition hover:border-cyan-300/40"
                >
                  Report a sighting <ArrowDownRight size={18} />
                </a>
              </div>

              <div className="mt-12 flex flex-wrap gap-x-7 gap-y-4 text-xs text-slate-500">
                <span className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-cyan-300" />
                  Privacy-conscious
                </span>
                <span className="flex items-center gap-2">
                  <Crosshair size={16} className="text-cyan-300" />
                  Location-aware
                </span>
                <span className="flex items-center gap-2">
                  <Heart size={16} className="text-cyan-300" />
                  Community-powered
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[580px]">
              <div className="absolute -inset-5 rounded-[36px] bg-cyan-300/[0.06] blur-2xl" />
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#10151e] p-3 shadow-2xl shadow-black/40">
                <div className="relative h-[300px] overflow-hidden rounded-[20px] sm:h-[390px]">
                  <img
                    src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=90"
                    alt="Golden dog looking toward the camera"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080b10] via-transparent to-black/10" />

                  <div className="absolute left-4 top-4 rounded-xl border border-white/15 bg-[#080b10]/75 px-3 py-2.5 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="h-2 w-2 rounded-full bg-cyan-300" />
                      RECOVERY NETWORK
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400">
                      Demo preview · Sample data
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-[#080b10]/85 p-4 backdrop-blur-xl sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-cyan-300">PET SPOTLIGHT</div>
                        <div className="mt-1 text-xl font-semibold">Every lead counts.</div>
                        <div className="mt-1 text-sm text-slate-400">
                          One community. One mission.
                        </div>
                      </div>
                      <div className="rounded-xl bg-cyan-300/10 p-3 text-cyan-300">
                        <PawPrint size={24} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 px-2 py-4 text-xs text-slate-400 sm:px-3">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-300" />
                    Built for every reunion
                  </span>
                  <span>PAWTRACE / 001</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="reports" className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="text-xs font-semibold tracking-[0.2em] text-cyan-300">
                THE COMMUNITY BOARD
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Every lead matters<span className="text-cyan-300">.</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                Browse reports and sightings shared by the community.
                These initial listings are demonstration data.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              DEMO ENVIRONMENT
            </div>
          </div>

          <div className="mt-9 grid gap-3 rounded-2xl border border-white/[0.08] bg-[#0e121a] p-3 sm:grid-cols-[1fr_auto_auto] sm:p-4">
            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.08] bg-[#080b10] px-4">
              <Search size={19} className="shrink-0 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, breed, or location..."
                aria-label="Search pet reports"
                className="w-full min-w-0 bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-600"
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#080b10] px-3">
              <SlidersHorizontal size={16} className="text-slate-500" />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-label="Filter by report status"
                className="w-full bg-transparent py-3.5 text-sm text-slate-300 outline-none"
              >
                <option className="bg-[#10151e]" value="All">All reports</option>
                <option className="bg-[#10151e]" value="Lost">Lost pets</option>
                <option className="bg-[#10151e]" value="Found">Found pets</option>
              </select>
              <ChevronDown size={14} className="shrink-0 text-slate-500" />
            </div>

            <select
              value={animal}
              onChange={(event) => setAnimal(event.target.value)}
              aria-label="Filter by animal"
              className="rounded-xl border border-white/[0.08] bg-[#080b10] px-4 py-3.5 text-sm text-slate-300 outline-none"
            >
              <option className="bg-[#10151e]" value="All">All animals</option>
              <option className="bg-[#10151e]" value="Dog">Dogs</option>
              <option className="bg-[#10151e]" value="Cat">Cats</option>
            </select>
          </div>

          <div className="mt-7 flex items-center justify-between text-sm">
            <span className="text-slate-400">
              <span className="font-semibold text-white">{filteredPets.length}</span>
              {' '}demonstration {filteredPets.length === 1 ? 'report' : 'reports'}
            </span>
            <span className="text-xs text-slate-600">SAMPLE DATA ONLY</span>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredPets.map((pet) => (
              <article
                key={pet.id}
                className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0e121a] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30"
              >
                <div className="relative h-[230px] overflow-hidden">
                  <img
                    src={pet.image}
                    alt={pet.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span
                    className={`absolute left-3 top-3 rounded-lg border px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${
                      pet.status === 'Lost'
                        ? 'border-rose-300/20 bg-rose-950/80 text-rose-200'
                        : 'border-emerald-300/20 bg-emerald-950/80 text-emerald-200'
                    }`}
                  >
                    {pet.status === 'Lost' ? 'Lost pet' : 'Found pet'}
                  </span>
                  <button
                    onClick={() => toggleSaved(pet.id)}
                    aria-label={saved.includes(pet.id) ? `Unsave ${pet.name}` : `Save ${pet.name}`}
                    className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/50 p-2.5 backdrop-blur-md transition hover:bg-black/80"
                  >
                    <Heart
                      size={17}
                      className={saved.includes(pet.id) ? 'fill-rose-400 text-rose-400' : 'text-white'}
                    />
                  </button>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold">{pet.name}</h3>
                      <p className="mt-1 text-xs text-slate-400">{pet.breed}</p>
                    </div>
                    <span className="rounded-lg bg-white/[0.05] px-2 py-1 text-[10px] text-slate-400">
                      {pet.type}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
                    <MapPin size={15} className="shrink-0 text-cyan-300" />
                    {pet.location}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3">
                    <span className="text-xs text-slate-500">{pet.date}</span>
                    <button
                      onClick={() => alert(`Report #${pet.id}: ${pet.name}\n\nThis is sample data. Report details will be connected to the backend later.`)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 transition hover:text-cyan-100"
                    >
                      View details <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredPets.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 px-5 py-14 text-center">
              <Search className="mx-auto text-slate-600" size={30} />
              <h3 className="mt-4 font-semibold">No matching reports</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try another search or reset your filters.
              </p>
              <button
                onClick={() => {
                  setQuery('')
                  setStatus('All')
                  setAnimal('All')
                }}
                className="mt-5 rounded-xl border border-white/10 px-4 py-2 text-sm hover:border-cyan-300/40"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        <section id="how-it-works" className="border-y border-white/[0.06] bg-[#0c1017]">
          <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold tracking-[0.2em] text-cyan-300">
                SIMPLE. CONNECTED. HUMAN.
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Every reunion starts somewhere.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                A straightforward process that helps the right information reach
                the right people.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  number: '01',
                  title: 'Share a report',
                  description: 'Upload a photo, describe the pet, and provide a sighting location.',
                },
                {
                  number: '02',
                  title: 'Connect the clues',
                  description: 'Compare reports and identify possible matches based on available information.',
                },
                {
                  number: '03',
                  title: 'Verify and reunite',
                  description: 'Review sightings safely and confirm a match before closing a case.',
                },
              ].map((step) => (
                <div key={step.number} className="rounded-2xl border border-white/[0.08] bg-[#10151e] p-6 sm:p-7">
                  <div className="text-sm font-bold tracking-widest text-cyan-300">{step.number}</div>
                  <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="safety" className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="flex flex-col gap-5 rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.08] to-transparent p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <ShieldCheck className="text-cyan-300" size={30} />
              <h2 className="mt-5 text-2xl font-semibold">Trust is part of the mission.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Pet recovery should protect people too. PAWTRACE is being designed
                with privacy-conscious contact sharing, report moderation, and
                verification in mind.
              </p>
            </div>
            <a
              href="#report"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3.5 font-bold text-[#071014] transition hover:bg-cyan-200"
            >
              Help the community <ArrowRight size={17} />
            </a>
          </div>
        </section>

        <section id="report" className="border-t border-white/[0.07] bg-[#0c1017]">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 py-12 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
            <div>
              <div className="text-xl font-black tracking-[0.15em]">
                PAWTRACE<span className="text-cyan-300">.</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Every sighting could make a difference.
              </p>
            </div>
            <p className="text-xs leading-6 text-slate-600">
              Portfolio prototype · Demonstration reports only
              <br />
              Not an official emergency or animal-control service.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
