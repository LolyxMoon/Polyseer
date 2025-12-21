import { NextResponse } from "next/server";

const KALSHI_API_BASE = "https://api.elections.kalshi.com/trade-api/v2";

export interface KalshiMarket {
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

interface MarketsResponse {
  markets: KalshiMarket[];
  cursor: string;
}

// Cache
let cachedMarkets: KalshiMarket[] | null = null;
let lastFetchTime = 0;
let lastApiBase = "";
const CACHE_DURATION = 60 * 1000; // 1 minuto

async function fetchKalshiMarkets(): Promise<KalshiMarket[]> {
  const allMarkets: KalshiMarket[] = [];
  let cursor: string | null = null;
  let pages = 0;
  const maxPages = 5;

  while (pages < maxPages) {
    const url = new URL(`${KALSHI_API_BASE}/markets`);
    url.searchParams.set("status", "open");
    url.searchParams.set("limit", "100");
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

    const response = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Kalshdiction/1.0",
      },
    });

    if (!response.ok) {
      console.error(`Kalshi API error: ${response.status}`);
      throw new Error(`Kalshi API error: ${response.status}`);
    }

    const data: MarketsResponse = await response.json();
    
    if (data.markets && data.markets.length > 0) {
      allMarkets.push(...data.markets);
    }

    if (!data.cursor || data.markets.length < 100) {
      break;
    }

    cursor = data.cursor;
    pages++;
  }

  console.log(`Fetched ${allMarkets.length} markets from Kalshi`);
  return allMarkets;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "12");
    const category = searchParams.get("category");
    const time = searchParams.get("time") || "weekly"; // daily, weekly, monthly, all

    const now = Date.now();

    // Usar cache si está disponible
    if (!cachedMarkets || now - lastFetchTime > CACHE_DURATION) {
      cachedMarkets = await fetchKalshiMarkets();
      lastFetchTime = now;
    }

    let markets = [...cachedMarkets];

    // Filtrar por categoría si se especifica
    if (category && category !== "all") {
      markets = markets.filter(m => 
        m.category?.toLowerCase() === category.toLowerCase()
      );
    }

    console.log(`Total markets: ${markets.length}`);

    const currentTime = new Date();
    const oneYearFromNow = new Date(currentTime.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    // Obtener fecha de cierre de cualquier campo disponible
    const getCloseDate = (m: any): Date | null => {
      const closeField = m.close_time || m.expiration_time || m.end_date || m.expected_expiration_time;
      if (!closeField) return null;
      try {
        return new Date(closeField);
      } catch {
        return null;
      }
    };

    // Agregar fecha de cierre y filtrar:
    // - Solo futuros
    // - Excluir mercados que cierran en más de 1 año (son placeholders)
    let marketsWithClose = markets.map(m => ({
      ...m,
      _closeDate: getCloseDate(m)
    })).filter(m => {
      if (!m._closeDate) return false;
      const closeTime = m._closeDate.getTime();
      return closeTime > currentTime.getTime() && closeTime < oneYearFromNow.getTime();
    });

    console.log(`Markets closing within 1 year: ${marketsWithClose.length}`);

    // Ordenar por close_time (más pronto primero)
    marketsWithClose.sort((a, b) => {
      return a._closeDate!.getTime() - b._closeDate!.getTime();
    });

    // Debug: mostrar los 5 mercados que cierran más pronto
    if (marketsWithClose.length > 0) {
      console.log(`Soonest closing markets:`);
      marketsWithClose.slice(0, 5).forEach((m, i) => {
        const daysUntil = Math.round((m._closeDate!.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`  ${i + 1}. [${daysUntil}d] ${m.title}`);
      });
    } else {
      // Si no hay mercados en 1 año, mostrar los más próximos de todos
      console.log(`No markets closing within 1 year, showing all sorted by close date`);
      marketsWithClose = markets.map(m => ({
        ...m,
        _closeDate: getCloseDate(m)
      })).filter(m => {
        if (!m._closeDate) return false;
        return m._closeDate.getTime() > currentTime.getTime();
      }).sort((a, b) => a._closeDate!.getTime() - b._closeDate!.getTime());
      
      if (marketsWithClose.length > 0) {
        console.log(`Earliest closing markets (any time):`);
        marketsWithClose.slice(0, 5).forEach((m, i) => {
          console.log(`  ${i + 1}. ${m._closeDate?.toISOString()} - ${m.title}`);
        });
      }
    }

    // Aplicar filtro de tiempo si no es "all"
    if (time !== "all") {
      const timeRanges: Record<string, number> = {
        daily: 24 * 60 * 60 * 1000,
        weekly: 7 * 24 * 60 * 60 * 1000,
        monthly: 30 * 24 * 60 * 60 * 1000,
      };
      
      const maxTime = timeRanges[time];
      if (maxTime) {
        const filtered = marketsWithClose.filter(m => {
          const diff = m._closeDate!.getTime() - currentTime.getTime();
          return diff <= maxTime;
        });
        
        // Solo usar el filtro si hay resultados, sino mostrar los más próximos
        if (filtered.length > 0) {
          marketsWithClose = filtered;
        } else {
          console.log(`No markets in ${time} range, showing soonest closing instead`);
        }
      }
    }

    // Limitar resultados y quitar el campo temporal
    const result = marketsWithClose.slice(0, limit).map(({ _closeDate, ...m }) => m);

    console.log(`Returning ${result.length} markets (time filter: ${time})`);

    // Obtener categorías únicas
    const categories = [...new Set(cachedMarkets.map(m => m.category).filter(Boolean))];

    return NextResponse.json({
      markets: result,
      categories,
      lastUpdated: new Date().toISOString(),
      totalMarkets: cachedMarkets.length,
    });
  } catch (error) {
    console.error("Kalshi markets API error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to fetch markets", 
        markets: [], 
        categories: [],
        totalMarkets: 0,
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
