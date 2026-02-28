// Central API config so the frontend always talks to the right backend
// in dev (local Mongo/Express) and on Vercel (deployed backend).
//
// Priority:
// 1. VITE_API_URL  – set this on Vercel to your backend URL
// 2. If in Vite dev, use local Express backend on port 8000
// 3. Otherwise, fall back to same-origin (for cases where frontend+backend are together)
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000" : window.location.origin);

const API = {
  BASE_URL: API_BASE_URL,

  ENDPOINTS: {
    LOGIN: "/api/login",
    REGISTER: "/api/register",
    LISTINGS: {
      CREATE: "/api/listings",
    },
    USERS: {
      LIKES: (userId: string) => `/api/users/${userId}/likes`,
      PROFILE: (userId: string) => `/api/users/${userId}`,
    },
  },
};

export const fetchListings = async (params?: {
  limit?: number;
  skip?: number;
  make?: string;
  model?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}) => {
  try {
    let url = `${API.BASE_URL}${API.ENDPOINTS.LISTINGS.CREATE}`;
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.skip) queryParams.append("skip", params.skip.toString());
    if (params?.make) queryParams.append("make", params.make);
    if (params?.model) queryParams.append("model", params.model);
    if (params?.minPrice) queryParams.append("minPrice", params.minPrice);
    if (params?.maxPrice) queryParams.append("maxPrice", params.maxPrice);
    if (params?.sort) queryParams.append("sort", params.sort);
    if (queryParams.toString()) url += `?${queryParams.toString()}`;
    const res = await fetch(url);
    const json = await res.json();
    if (Array.isArray(json)) return { data: json, total: json.length };
    if (json && Array.isArray(json.data))
      return { data: json.data, total: json.total || json.data.length };
    return { data: [], total: 0 };
  } catch (e) {
    console.error(e);
    return { data: [] };
  }
};

export const fetchListingById = async (id: string) => {
  const res = await fetch(`${API.BASE_URL}/api/listings/${id}`);
  return res.json();
};

export default API;
