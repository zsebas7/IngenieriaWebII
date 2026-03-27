import { Injectable } from '@nestjs/common';
import axios from 'axios';

type CachedRates = {
  fetchedAt: number;
  rates: Record<string, number>;
};

@Injectable()
export class ExchangeRateService {
  private cache: CachedRates | null = null;

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

    const response = await axios.get('https://api.frankfurter.app/latest?from=ARS&to=USD,EUR');
    const ratesFromArs = response.data?.rates ?? { USD: 0.001, EUR: 0.001 };

    const ratesToArs = {
      USD: ratesFromArs.USD ? 1 / ratesFromArs.USD : 1,
      EUR: ratesFromArs.EUR ? 1 / ratesFromArs.EUR : 1,
      ARS: 1,
    };

    this.cache = { fetchedAt: now, rates: ratesToArs };
    return ratesToArs;
  }
}
