import { useState, useEffect } from "react";
import {
  MoveRight,
  Upload,
  Loader2,
  XCircle,
  MapPin,
  Star,
  ExternalLink,
  ShoppingBag,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import "../App.css";

const baseURL = import.meta.env.VITE_BACKEND_API_URL;

// --- Helper: Badge Component ---
const CategoryBadge = ({ category }) => {
  const colors = {
    electronics: "bg-blue-100 text-blue-700",
    fashion: "bg-pink-100 text-pink-700",
    grocery: "bg-green-100 text-green-700",
    pharmacy: "bg-red-100 text-red-700",
    default: "bg-gray-100 text-gray-700",
  };
  const theme = colors[category] || colors.default;

  return (
    <span
      className={`px-3! py-1! rounded-full! text-xs font-semibold uppercase tracking-wide ${theme}`}
    >
      {category}
    </span>
  );
};

// --- Helper: Online Shops Component ---
const OnlineShops = ({ platforms }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3! mt-3!">
    {platforms.map((p, index) => (
      <a
        key={index}
        href={p.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between p-3! rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
      >
        <div className="flex items-center gap-2! overflow-hidden">
          <ShoppingBag className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 truncate">
            {p.platform}
          </span>
        </div>
        <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />
      </a>
    ))}
  </div>
);

// --- Helper: Offline Shops Component ---
const OfflineShops = ({ shops }) => (
  <div className="mt-3! space-y-3!">
    {shops.length > 0 ? (
      shops.map((shop, index) => (
        <div
          key={index}
          className="flex flex-col sm:flex-row sm:items-center justify-between p-3! rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex gap-3">
            <div className="mt-1!">
              <div className="p-2! bg-indigo-50 rounded-full!">
                <Store className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{shop.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{shop.address}</p>

              <div className="flex items-center gap-3 mt-1.5">
                <span
                  className={`text-xs font-medium ${
                    shop.openStatus?.includes("Open")
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {shop.openStatus}
                </span>
                {shop.rating && shop.rating !== "N/A" && (
                  <span className="flex items-center text-xs text-amber-500 font-medium">
                    <Star className="w-3 h-3 fill-current mr-1" />
                    {shop.rating}
                  </span>
                )}
              </div>
            </div>
          </div>

          <a
            href={shop.directionLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3! sm:mt-0 flex items-center justify-center sm:justify-start gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3! py-2! rounded-md transition-colors"
          >
            <MapPin className="w-3 h-3" /> Directions
          </a>
        </div>
      ))
    ) : (
      <div className="p-4 bg-gray-50 rounded-lg text-center border border-dashed border-gray-200">
        <p className="text-sm text-gray-500">
          No nearby physical stores found.
        </p>
      </div>
    )}
  </div>
);

// --- Main Component ---
export const Hero5 = () => {
  const [list, setList] = useState("");
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getGeoLocation();
  }, []);

  const handleInputChange = (e) => {
    setList(e.target.value);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const getGeoLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.warn("Geolocation not supported");
        reject("Not supported");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(coords);
          resolve(coords);
        },
        (error) => {
          console.error(error);
          reject(error);
        }
      );
    });
  };

  const handleSearch = async () => {
    if (list === "" && file === null) {
      alert("Please enter your items or upload an image");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResults([]);

    let coords = location;
    try {
      if (!coords.latitude || !coords.longitude) {
        coords = await getGeoLocation();
      }
    } catch (e) {
      console.log("Location fetch failed, proceeding anyway.");
    }

    try {
      const response = await axios.post(`${baseURL}/search`, {
        text: list,
        location: coords,
      });
      setSearchResults(response.data.results || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch results. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full sm:px-3 lg:px-2">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center py-8 sm:py-12 gap-8">
          {/* --- Header Section --- */}
          <div className="flex flex-col gap-6 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
              <span className="text-spektr-cyan-50">
                Are you thinking about
                <br />
                <span className="font-bold">where2buy</span>
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
              Type/paste the list of items you want to buy, or upload an image
              of your shopping list and we'll help you find the best places to
              purchase them.
            </p>
          </div>
          {/* Input Card Section */}
          <div className="w-full max-w-2xl flex flex-col gap-6 ">
            <div className="rounded-xl bg-white p-6 sm:p-8 text-left space-y-6">
              {/* Input Field Group */}
              <div className="space-y-3 padding-1">
                <label
                  htmlFor="items-input"
                  className="block text-sm font-semibold text-gray-700 ml-1 padding-2"
                >
                  Enter your items
                </label>
                <Input
                  id="items-input"
                  placeholder="e.g. Milk, Nike Shoes, Panadol..."
                  value={list}
                  onChange={handleInputChange}
                  className="w-full !px-4 !py-3 text-base bg-gray-50 focus:bg-white transition-colors h-12 rounded-lg"
                />
              </div>

              {/* Buttons Group */}
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex-1 flex items-center justify-center h-14 px-4 border border-dashed border-gray-300 rounded-lg cursor-pointer text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition bg-white">
                  <Upload className="w-4 h-4 mr-2! text-gray-400" />
                  {file ? (
                    <span className="text-green-600 truncate max-w-[150px] font-semibold">
                      {file.name}
                    </span>
                  ) : (
                    "Upload list image"
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                <Button
                  size="lg"
                  className="flex-1 h-14 px-6 flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-all font-semibold shadow-md hover:shadow-lg"
                  onClick={handleSearch}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Searching...
                    </>
                  ) : (
                    <>
                      Search <MoveRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="flex items-center justify-center p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2 shadow-sm">
                <XCircle className="w-5 h-5 mr-2" /> {error}
              </div>
            )}
          </div>
          {/* --- Results Section --- */}
          {searchResults.length > 0 && (
            <div className="w-full max-w-3xl text-left mt-4 space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center gap-4 padding-1">
                <div className="h-px bg-gray-200 flex-1"></div>
                <h3 className="text-gray-400 font-medium text-sm uppercase tracking-wider">
                  Search Results
                </h3>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              {searchResults.map((result, i) => (
                <div
                  key={i}
                  className="bg-white overflow-hidden transition-all"
                >
                  <div className=" px-6! py-4!  flex items-center justify-between">
                    <h4 className="text-xl font-bold text-gray-800 capitalize flex items-center gap-2">
                      {result.item}
                    </h4>
                    <CategoryBadge category={result.category} />
                  </div>

                  {/* Card Body */}
                  <div className="p-4! grid gap-8! md:grid-cols-2">
                    {/* Left Column: Online */}
                    <div>
                      <div className="flex items-center gap-2! mb-3!">
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                        <h5 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
                          Buy Online
                        </h5>
                      </div>
                      <OnlineShops platforms={result.online} />
                    </div>

                    {/* Right Column: Offline */}
                    <div>
                      <div className="flex items-center gap-2! mb-3!">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        <h5 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
                          Nearby Stores
                        </h5>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-1">
                        <OfflineShops shops={result.offline} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
