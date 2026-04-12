import { Injectable } from '@nestjs/common';
import axios from 'axios';

type CachedRates = {
  fetchedAt: number;
  rates: Record<string, number>;
};

@Injectable()
export class ExchangeRateService {
  private cache: CachedRates | null = null;

  private static readonly STATIC_FALLBACK_RATES = {
    ARS: 1,
    USD: 1200,
    EUR: 1300,
  };

  async convertToArs(amount: number, currency: string) {
    if (currency === 'ARS') {
      return amount;
    }

    const rates = await this.getRates();
    const rate = rates[currency];
    if (!rate) {
      return amount;
    }

    return Number((amount * rate).toFixed(2));
  }

  async convertFromArs(amountArs: number, currency: string) {
    if (currency === 'ARS') {
      return amountArs;
    }

    const rates = await this.getRates();
    const rate = rates[currency];
    if (!rate || rate === 0) {
      return amountArs;
    }

    return Number((amountArs / rate).toFixed(2));
  }

  async getRates() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (this.cache && now - this.cache.fetchedAt < oneDay) {
      return this.cache.rates;
    }

    try {
      const ratesToArs =
        (await this.fetchOpenErApiRatesToArs()) ?? (await this.fetchFrankfurterRatesToArs()) ?? null;

      if (!ratesToArs) {
        throw new Error('No exchange provider available');
      }

      this.cache = { fetchedAt: now, rates: ratesToArs };
      return ratesToArs;
    } catch {
      if (this.cache) {
        return this.cache.rates;
      }

      return ExchangeRateService.STATIC_FALLBACK_RATES;
    }
  }

  private async fetchOpenErApiRatesToArs(): Promise<Record<string, number> | null> {
    try {
      const response = await axios.get('https://open.er-api.com/v6/latest/ARS', { timeout: 4500 });
      const rates = response.data?.rates;
      const usdFromArs = Number(rates?.USD ?? 0);
      const eurFromArs = Number(rates?.EUR ?? 0);

      if (usdFromArs <= 0 || eurFromArs <= 0) {
        return null;
      }

      return {
        ARS: 1,
        USD: Number((1 / usdFromArs).toFixed(4)),
        EUR: Number((1 / eurFromArs).toFixed(4)),
      };
    } catch {
      return null;
    }
  }

  private async fetchFrankfurterRatesToArs(): Promise<Record<string, number> | null> {
    try {
      const response = await axios.get('https://api.frankfurter.app/latest?from=ARS&to=USD,EUR', { timeout: 4500 });
      const ratesFromArs = response.data?.rates;
      const usdFromArs = Number(ratesFromArs?.USD ?? 0);
      const eurFromArs = Number(ratesFromArs?.EUR ?? 0);

      if (usdFromArs <= 0 || eurFromArs <= 0) {
        return null;
      }

      return {
        ARS: 1,
        USD: Number((1 / usdFromArs).toFixed(4)),
        EUR: Number((1 / eurFromArs).toFixed(4)),
      };
    } catch {
      return null;
    }
  }
}
