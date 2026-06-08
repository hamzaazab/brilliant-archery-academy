import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RankingEntry } from '../../models/ranking.model';
import { Tournament } from '../../models/tournament.model';
import { AuthService } from '../../services/auth.service';
import { ContentService } from '../../services/content.service';

interface EditableTournament extends Tournament {
  imagesText: string;
}

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
  rankings: RankingEntry[] = [];
  tournaments: EditableTournament[] = [];
  loading = true;
  savingRankings = false;
  savingTournaments = false;
  message = '';

  constructor(
    private readonly contentService: ContentService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.getToken()) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.contentService.getAllContent().subscribe({
      next: (payload) => {
        this.rankings = payload.rankings;
        this.tournaments = payload.tournaments.map((item) => ({
          ...item,
          imagesText: (item.images || []).join(', ')
        }));
        this.loading = false;
      },
      error: () => {
        this.message = 'تعذر تحميل البيانات.';
        this.loading = false;
      }
    });
  }

  addRankingRow() {
    const nextRank = this.rankings.length + 1;
    this.rankings.push({ rank: nextRank, name: '', participations: 0, medals: 0, gold: 0, silver: 0, bronze: 0, points: 0 });
  }

  removeRankingRow(index: number) {
    this.rankings.splice(index, 1);
    this.rankings = this.rankings.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  }

  addTournament() {
    const nextId = this.tournaments.length ? Math.max(...this.tournaments.map((t) => Number(t.id) || 0)) + 1 : 1;
    this.tournaments.push({
      id: nextId,
      title: 'بطولة جديدة',
      type: 'رسمية',
      date: 'يناير 2026',
      location: 'القاهرة',
      summary: '',
      description: '',
      images: [],
      imagesText: '',
      accent: 'amber'
    });
  }

  removeTournament(index: number) {
    this.tournaments.splice(index, 1);
  }

  saveRankings() {
    const token = this.authService.getToken();
    if (!token) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.savingRankings = true;
    this.message = '';

    const normalized = this.rankings
      .map((entry, idx) => ({
        rank: idx + 1,
        name: entry.name || '',
        participations: Number(entry.participations) || 0,
        medals: Number(entry.medals) || 0,
        gold: Number(entry.gold) || 0,
        silver: Number(entry.silver) || 0,
        bronze: Number(entry.bronze) || 0,
        points: Number(entry.points) || 0
      }))
      .sort((a, b) => a.rank - b.rank);

    this.contentService.updateRankings(normalized, token).subscribe({
      next: () => {
        this.rankings = normalized;
        this.savingRankings = false;
        this.message = 'تم تحديث التصنيف بنجاح.';
      },
      error: () => {
        this.savingRankings = false;
        this.message = 'فشل تحديث التصنيف.';
      }
    });
  }

  saveTournaments() {
    const token = this.authService.getToken();
    if (!token) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.savingTournaments = true;
    this.message = '';

    const payload: Tournament[] = this.tournaments.map((entry, index) => ({
      id: Number(entry.id) || index + 1,
      title: entry.title || '',
      type: entry.type || 'رسمية',
      date: entry.date || '',
      location: entry.location || '',
      summary: entry.summary || '',
      description: entry.description || '',
      images: (entry.imagesText || '')
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean),
      accent: entry.accent || 'amber'
    }));

    this.contentService.updateTournaments(payload, token).subscribe({
      next: () => {
        this.savingTournaments = false;
        this.message = 'تم تحديث البطولات بنجاح.';
      },
      error: () => {
        this.savingTournaments = false;
        this.message = 'فشل تحديث البطولات.';
      }
    });
  }
}
