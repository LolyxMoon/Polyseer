"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ExternalLink,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronRight,
  Activity,
  Timer,
} from "lucide-react";

interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  subtitle: string;
  yes_price: number;
  no_price: number;
  volume: number;
  volume_24h: number;
  open_interest: number;
  status: string;
  close_time: string;
  category: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  previous_price: number;
  previous_yes_price: number;
}

interface MarketsData {
  markets: KalshiMarket[];
  categories: string[];
  lastUpdated: string;
  totalMarkets: number;
}

type TimeFilter = "daily" | "weekly" | "monthly" | "all";

const formatVolume = (vol: number) => {
  if (!vol || vol === 0) return "$0";
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
  if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
  return `$${vol}`;
};

const formatPrice = (cents: number | undefined | null) => {
  if (cents === undefined || cents === null) return "—";
  return `${Math.round(cents)}¢`;
};

const getTimeUntil = (closeTime: string | undefined | null) => {
  if (!closeTime) return "";
  
  try {
    const now = new Date();
    const close = new Date(closeTime);
    const diff = close.getTime() - now.getTime();

    if (diff < 0) return "Closed";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  } catch {
    return "";
  }
};

const getUrgencyColor = (closeTime: string | undefined | null) => {
  if (!closeTime) return "text-violet-400";
  
  try {
    const now = new Date();
    const close = new Date(closeTime);
    const diff = close.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours <= 24) return "text-red-400"; // Menos de 24h
    if (hours <= 72) return "text-orange-400"; // Menos de 3 días
    if (hours <= 168) return "text-yellow-400"; // Menos de 7 días
    return "text-violet-400";
  } catch {
    return "text-violet-400";
  }
};

const getCategoryColor = (category: string | undefined | null) => {
  if (!category) return "bg-violet-500/20 text-violet-400";
  
  const colors: Record<string, string> = {
    Politics: "bg-blue-500/20 text-blue-400",
    Sports: "bg-green-500/20 text-green-400",
    Crypto: "bg-orange-500/20 text-orange-400",
    Economics: "bg-purple-500/20 text-purple-400",
    Climate: "bg-teal-500/20 text-teal-400",
    Entertainment: "bg-pink-500/20 text-pink-400",
    Tech: "bg-cyan-500/20 text-cyan-400",
    Finance: "bg-yellow-500/20 text-yellow-400",
    Financial: "bg-yellow-500/20 text-yellow-400",
  };
  return colors[category] || "bg-violet-500/20 text-violet-400";
};

const getYesPrice = (market: KalshiMarket): number => {
  if (typeof market.yes_price === 'number' && market.yes_price > 0) return market.yes_price;
  if (typeof market.yes_bid === 'number' && market.yes_bid > 0) return market.yes_bid;
  if (typeof market.last_price === 'number' && market.last_price > 0) return market.last_price;
  if (typeof market.yes_ask === 'number' && market.yes_ask > 0) return market.yes_ask;
  return 50;
};

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
};

const getKalshiUrl = (market: KalshiMarket): string => {
  const eventTicker = market.event_ticker?.toLowerCase() || '';
  const title = market.title || '';
  const seriesTicker = eventTicker.replace(/-\d+$/, '').toLowerCase();
  const slug = generateSlug(title);
  
  if (seriesTicker && slug && eventTicker) {
    return `https://kalshi.com/markets/${seriesTicker}/${slug}/${eventTicker}`;
  }
  
  if (eventTicker) {
    return `https://kalshi.com/events/${eventTicker}`;
  }
  
  return "https://kalshi.com/markets";
};

interface MarketCardProps {
  market: KalshiMarket;
  index: number;
}

const MarketCard = ({ market, index }: MarketCardProps) => {
  const yesPrice = getYesPrice(market);
  const volume = market.volume_24h || market.volume || 0;
  const timeLeft = getTimeUntil(market.close_time);
  const urgencyColor = getUrgencyColor(market.close_time);

  return (
    <motion.a
      href={getKalshiUrl(market)}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="block bg-violet-900/30 border border-violet-500/20 rounded-xl p-4 hover:border-violet-400/40 hover:bg-violet-900/40 transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left side - Market info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {market.category && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(market.category)}`}>
                {market.category}
              </span>
            )}
            {timeLeft && (
              <span className={`text-xs flex items-center gap-1 font-medium ${urgencyColor}`}>
                <Timer className="w-3 h-3" />
                {timeLeft}
              </span>
            )}
          </div>

          <h3 className="font-semibold text-white text-sm sm:text-base leading-tight mb-1 line-clamp-2 group-hover:text-violet-200 transition-colors">
            {market.title || "Untitled Market"}
          </h3>

          {market.subtitle && (
            <p className="text-xs text-violet-400 line-clamp-1">{market.subtitle}</p>
          )}
        </div>

        {/* Right side - Price & Stats */}
        <div className="text-right flex-shrink-0">
          <div className="flex items-center justify-end gap-2 mb-1">
            <span className="text-lg font-bold text-green-400">
              {formatPrice(yesPrice)}
            </span>
            <span className="text-xs text-violet-400">YES</span>
          </div>

          <div className="text-xs text-violet-400 mt-1">
            Vol: {formatVolume(volume)}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-4 h-4 text-violet-500 group-hover:text-violet-300 transition-colors flex-shrink-0 mt-1" />
      </div>

      {/* Progress bar showing YES price */}
      <div className="mt-3 h-1.5 bg-violet-950 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(Math.max(yesPrice, 0), 100)}%` }}
        />
      </div>
    </motion.a>
  );
};

export default function KalshiMarkets() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("weekly");
  const [data, setData] = useState<MarketsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const fetchMarkets = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        type: "closing",
        limit: "12",
        time: timeFilter,
        ...(selectedCategory !== "all" && { category: selectedCategory }),
      });

      const response = await fetch(`/api/kalshi-markets?${params}`);
      if (!response.ok) throw new Error("Failed to fetch markets");

      const result: MarketsData = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, [timeFilter, selectedCategory]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMarkets(true);
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [timeFilter, selectedCategory]);

  const timeFilters = [
    { id: "daily" as TimeFilter, label: "24h" },
    { id: "weekly" as TimeFilter, label: "7d" },
    { id: "monthly" as TimeFilter, label: "30d" },
    { id: "all" as TimeFilter, label: "All" },
  ];

  return (
    <section className="w-full py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4"
          >
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-sm text-violet-300">Live Markets</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-3"
          >
            Closing Soon
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-violet-300 max-w-lg mx-auto"
          >
            Markets about to resolve. Find opportunities before they close.
          </motion.p>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-6"
        >
          {/* Time Filters */}
          <div className="flex items-center gap-1 bg-violet-900/30 p-1 rounded-xl">
            {timeFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setTimeFilter(filter.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeFilter === filter.id
                    ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                    : "text-violet-400 hover:text-white hover:bg-violet-800/50"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Category filter */}
          {data?.categories && data.categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-violet-900/30 border border-violet-500/20 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400"
            >
              <option value="all">All Categories</option>
              {data.categories.slice(0, 10).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {/* Refresh button */}
          <button
            onClick={() => fetchMarkets(true)}
            disabled={isRefreshing}
            className="p-2 text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50 bg-violet-900/30 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300 text-sm">{error}</span>
            <button
              onClick={() => fetchMarkets()}
              className="ml-auto text-sm text-red-400 hover:text-red-300 underline"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-4" />
            <p className="text-violet-300">Loading markets...</p>
          </div>
        )}

        {/* Markets Grid */}
        {!loading && data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {data.markets.map((market, index) => (
                <MarketCard
                  key={market.ticker}
                  market={market}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && data && data.markets.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-violet-500 mx-auto mb-4" />
            <p className="text-violet-400 mb-2">No markets closing in this timeframe</p>
            <p className="text-violet-500 text-sm">Try selecting a longer time period</p>
          </div>
        )}

        {/* Footer */}
        {data && data.markets.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <p className="text-xs text-violet-500">
              Showing {data.markets.length} markets closing soon • Sorted by close time
            </p>

            <a
              href="https://kalshi.com/markets"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              View all on Kalshi
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        )}
      </div>
    </section>
  );
}
