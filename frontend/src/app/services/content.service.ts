import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ContentPayload } from '../models/content.model';
import { RankingEntry } from '../models/ranking.model';
import { Tournament } from '../models/tournament.model';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly apiBase = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) {}

  getRankings() {
    return this.http.get<RankingEntry[]>(`${this.apiBase}/rankings`);
  }

  getTournaments() {
    return this.http.get<Tournament[]>(`${this.apiBase}/tournaments`);
  }

  getAllContent() {
    return this.http.get<ContentPayload>(`${this.apiBase}/content`);
  }

  updateRankings(rankings: RankingEntry[], token: string) {
    return this.http.put<{ message: string; rankings: RankingEntry[] }>(
      `${this.apiBase}/admin/rankings`,
      { rankings },
      { headers: this.authHeaders(token) }
    );
  }

  updateTournaments(tournaments: Tournament[], token: string) {
    return this.http.put<{ message: string; tournaments: Tournament[] }>(
      `${this.apiBase}/admin/tournaments`,
      { tournaments },
      { headers: this.authHeaders(token) }
    );
  }

  private authHeaders(token: string) {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
