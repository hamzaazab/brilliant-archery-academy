import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RankingEntry } from '../../models/ranking.model';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'app-ranking-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ranking.component.html'
})
export class RankingComponent implements OnInit {
  rankings: RankingEntry[] = [];
  loading = true;

  constructor(private readonly contentService: ContentService) {}

  ngOnInit(): void {
    this.contentService.getRankings().subscribe({
      next: (rankings) => {
        this.rankings = rankings;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  rowClass(rank: number) {
    if (rank === 1) {
      return 'hover:bg-amber-50/30 transition-colors';
    }
    if (rank === 2) {
      return 'hover:bg-slate-50/50 transition-colors';
    }
    if (rank === 3) {
      return 'hover:bg-amber-700/5 transition-colors';
    }
    return 'hover:bg-gray-50/50 transition-colors';
  }

  rankClass(rank: number) {
    if (rank === 1) {
      return 'text-amber-500';
    }
    if (rank === 2) {
      return 'text-slate-400';
    }
    if (rank === 3) {
      return 'text-amber-700';
    }
    return 'text-gray-500';
  }
}
