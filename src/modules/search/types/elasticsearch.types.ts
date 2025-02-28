import { AggregateName } from '@elastic/elasticsearch/lib/api/types';

export interface StatsAggregation {
  count: number;
  min: number;
  max: number;
  avg: number;
  sum: number;
}

export interface TermsBucket {
  key: string;
  doc_count: number;
}

export interface TermsAggregation {
  buckets: TermsBucket[];
}

export interface ListingAggregations {
  price_stats: StatsAggregation;
  conditions: TermsAggregation;
} 