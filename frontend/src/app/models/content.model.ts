import { RankingEntry } from './ranking.model';
import { Tournament } from './tournament.model';

export interface ContentPayload {
  rankings: RankingEntry[];
  tournaments: Tournament[];
}
