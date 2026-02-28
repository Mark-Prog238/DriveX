import { NavbarSecond } from "../components/NavbarSecond";
import { Footer } from "../components/Footer";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { motion } from "framer-motion";
import { DollarSign, ShieldCheck, Zap, Search, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import API, { fetchListings } from "../components/api";
import { ListingCard } from "../components/ListingCard";
import { Link, useNavigate } from "react-router"; // Ali "next/link" / "next/navigation" če si na Next.js

export const HomePage = () => {
  const navigate = useNavigate(); // Za preusmeritev pri iskanju
  const [makes, setMakes] = useState<{ id: number; name: string }[]>([]);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [models, setModels] = useState<{ id: number; name: string }[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [featured, setFeatured] = useState<any[]>([]);

  // Fetch Makes
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

  // Fetch Models when Make changes
  useEffect(() => {
    if (!make) {
      setModels([]);
      setModel("");
      return;
    }
    (async () => {
      try {
        const r = await fetch(`${API.BASE_URL}/api/cars/models/${make}`);
        const j = await r.json();
        setModels(j.data || []);
      } catch (e) {
        console.error("Failed to fetch models", e);
      }
    })();
  }, [make]);

  // Fetch Featured Listings
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchListings({ limit: 3 });
        const items = res.data || [];
        setFeatured(items);
      } catch {
        setFeatured([]);
      }
    })();
  }, []);

  const handleSearch = () => {
    const query = new URLSearchParams();
    if (make) query.set("make", make);
    if (model) query.set("model", model);
    if (minPrice) query.set("minPrice", minPrice);
    if (maxPrice) query.set("maxPrice", maxPrice);

    navigate(`/listings?${query.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#0f111a] text-white font-sans flex flex-col">
      <NavbarSecond />

      {/* --- HERO SECTION --- */}
      <section className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden">
        {/* Background Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1920&auto=format&fit=crop"
            alt="Luxury Car"
            className="h-full w-full object-cover"
          />
          {/* Gradient Overlay: Black at bottom, transparent at top */}
          <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/40 to-[#0f111a]" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl px-4 flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6"
          >
            Drive Your <span className="text-blue-500">Dream</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl"
          >
            The premium marketplace for buying and selling vehicles. Verified
            dealers, transparent pricing, instant listings.
          </motion.p>

          {/* --- SEARCH BOX --- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="w-full bg-[#181a25]/90 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Make Select */}
              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-gray-400 ml-1">
                  Make
                </label>
                <Select
                  value={make}
                  onChange={(e: any) => setMake(e.target.value)}
                  className="bg-[#0f111a] border-white/10 text-white h-12"
                >
                  <option value="">All Makes</option>
                  {makes.map((m) => (
                    <option key={m.id} value={m.name} className="text-white">
                      {m.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Model Select */}
              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-gray-400 ml-1">
                  Model
                </label>
                <Select
                  value={model}
                  onChange={(e: any) => setModel(e.target.value)}
                  disabled={!make}
                  className="bg-[#0f111a] border-white/10 text-white h-12 disabled:opacity-50"
                >
                  <option value="">All Models</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.name} className="text-white">
                      {m.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-gray-400 ml-1">
                  Price Range (€)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={minPrice}
                    onChange={(e: any) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    type="number"
                    className="bg-[#0f111a] border-white/10 text-white h-12 placeholder:text-gray-600"
                  />
                  <Input
                    value={maxPrice}
                    onChange={(e: any) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    type="number"
                    className="bg-[#0f111a] border-white/10 text-white h-12 placeholder:text-gray-600"
                  />
                </div>
              </div>

              {/* Search btn */}
              <div className="flex items-end">
                <Button
                  onClick={handleSearch}
                  className="items- justify-center flex w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-900/20"
                >
                  <Search className="mr-2" size={20} /> Search
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FEATURES / WHY US --- */}
      <section className="bg-[#0f111a] py-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">Why Choose CarShop?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <ShieldCheck size={40} className="text-green-500" />,
                title: "Verified Dealers",
                text: "Every seller is vetted to ensure safety and trust.",
              },
              {
                icon: <Zap size={40} className="text-yellow-500" />,
                title: "Fast Listings",
                text: "List your car in under 3 minutes with our smart tools.",
              },
              {
                icon: <DollarSign size={40} className="text-blue-500" />,
                title: "Transparent Pricing",
                text: "No hidden fees. What you see is what you get.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 bg-[#181a25] rounded-xl border border-white/5 hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="mb-4 flex justify-center">{item.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURED LISTINGS --- */}
      <section className="py-20 bg-[#0f111a]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">Latest Arrivals</h2>
              <p className="text-gray-400">
                Check out the freshest cars on the market.
              </p>
            </div>
            <Link
              to="/listings"
              className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 group"
            >
              View Inventory{" "}
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="text-center py-12 bg-[#181a25] rounded-xl border border-white/10">
              <p className="text-gray-500">Loading listings...</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((l) => (
                <ListingCard key={l._id} listing={l} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 bg-linear-to-r from-blue-900 to-[#0f111a] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">Ready to Sell Your Car?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of satisfied sellers. Get the best price for your
            vehicle today.
          </p>
          <Link to="/sell">
            <Button className="bg-white  hover:bg-gray-100 px-10 py-6 rounded-full shadow-xl">
              <p className="text-blue-900 font-bold text-lg">
                List Your Car for Free
              </p>
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};
