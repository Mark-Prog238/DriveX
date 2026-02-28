import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { NavbarSecond } from "../components/NavbarSecond";
import { ListingCard } from "../components/ListingCard";
import API, { fetchListings } from "../components/api";
import { Select } from "../ui/Select";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Pagination } from "../ui/Pagination";
import { Search, X, Car, DollarSign } from "lucide-react";

export const ListingsPage = () => {
  const [searchParams] = useSearchParams(); // 2. Get URL params
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Initialize state from URL params if available
  const [make, setMake] = useState(searchParams.get("make") || "");
  const [model, setModel] = useState(searchParams.get("model") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  const [sort, setSort] = useState("new");
  const [page, setPage] = useState(1);
  const [makes, setMakes] = useState<{ id: number; name: string }[]>([]);

  // Fetch Makes (brands) for the filter sidebar
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API.BASE_URL}/api/cars/makes`);
        const j = await r.json();
        setMakes(j.data || []);
      } catch (e) {
        console.error("Failed to fetch makes", e);
      }
    })();
  }, []);

  // --- FETCHING LISTINGS ---
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const pageSize = 9;
        const skip = (page - 1) * pageSize;
        const res = await fetchListings({
          limit: pageSize,
          skip,
          make: make || undefined,
          model: model || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          sort: sort === "new" ? undefined : sort,
        });
        setListings(res.data);
        setTotal(res.total);
      } catch (error) {
        console.error("Failed to load listings", error);
        setListings([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [make, model, minPrice, maxPrice, sort, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [make, model, minPrice, maxPrice, sort]);

  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = listings;

  const uniqueMakes = makes.map((m) => m.name);

  const handleResetFilters = () => {
    setMake("");
    setModel("");
    setMinPrice("");
    setMaxPrice("");
    setSort("new");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-10">
      <NavbarSecond />

      <section className="mx-auto max-w-7xl px-4 py-8 flex-1">
        <h1 className="text-3xl font-black text-white pb-6 tracking-tight">
          Browse Inventory
        </h1>

        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* --- SIDEBAR (FILTERS) --- */}
          <aside className="h-fit rounded-xl bg-surface p-6 shadow-xl border border-white/10 lg:sticky lg:top-20">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <Search size={18} className="text-primary" /> Refine Search
            </h2>
            <div className="space-y-4">
              {/* Make Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase ml-1">
                  Make
                </label>
                <Select
                  value={make}
                  onChange={(e: any) => setMake(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Makes</option>
                  {uniqueMakes.map((m) => (
                    <option key={m} value={m} className="text-white">
                      {m}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Model Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase ml-1">
                  Model
                </label>
                <Input
                  value={model}
                  onChange={(e: any) => setModel(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Golf, 3 Series"
                />
              </div>

              {/* Price Range */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase ml-1 flex items-center gap-1">
                  <DollarSign size={14} /> Price (€)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={minPrice}
                    onChange={(e: any) => setMinPrice(e.target.value)}
                    className="input-field"
                    placeholder="Min"
                    type="number"
                  />
                  <Input
                    value={maxPrice}
                    onChange={(e: any) => setMaxPrice(e.target.value)}
                    className="input-field"
                    placeholder="Max"
                    type="number"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase ml-1">
                  Sort By
                </label>
                <Select
                  value={sort}
                  onChange={(e: any) => setSort(e.target.value)}
                  className="input-field"
                >
                  <option value="new">Newest First</option>
                  <option value="price_asc">Price (Low to High)</option>
                  <option value="price_desc">Price (High to Low)</option>
                </Select>
              </div>

              {/* Reset Button */}
              <Button
                variant="secondary"
                onClick={handleResetFilters}
                className="w-full mt-2 border-white/10 hover:bg-white/5 flex items-center justify-center"
              >
                <X size={16} className="mr-2" />
                <p className="text-white">Reset Filters</p>
              </Button>
            </div>
          </aside>

          {/* --- RESULTS --- */}
          <div>
            {loading ? (
              <div className="grid place-items-center h-64 text-text-muted">
                Loading inventory...
              </div>
            ) : total === 0 && !loading ? (
              <div className="text-center py-12 bg-surface rounded-xl border border-white/10">
                <Car size={36} className="mx-auto text-text-muted mb-4" />
                <p className="text-xl text-white">
                  No cars found matching your criteria.
                </p>
                <p className="text-text-muted">
                  Try resetting the filters or check back later.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {pageItems.map((l) => (
                    <ListingCard key={l._id} listing={l} />
                  ))}
                </div>

                <div className="mt-8 flex justify-center">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onChange={setPage}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
