import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Tournament } from '../../models/tournament.model';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'app-tournaments-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tournaments.component.html'
})
export class TournamentsComponent implements OnInit {
  tournaments: Tournament[] = [];
  selectedTournament: Tournament | null = null;
  loading = true;

  constructor(private readonly contentService: ContentService) {}

  ngOnInit(): void {
    this.contentService.getTournaments().subscribe({
      next: (items) => {
        this.tournaments = items;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openTournamentModal(tournament: Tournament) {
    this.selectedTournament = tournament;
    document.body.style.overflow = 'hidden';
  }

  closeTournamentModal() {
    this.selectedTournament = null;
    document.body.style.overflow = 'auto';
  }

  modalTypeClass(type: string) {
    return type === 'ودية'
      ? 'text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700'
      : 'text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700';
  }

  cardAccentClass(accent?: string) {
    return accent === 'blue' ? 'border-r-blue-500' : 'border-r-amber-500';
  }

  cardTypeClass(type: string) {
    return type === 'ودية'
      ? 'bg-green-50 text-green-700'
      : 'bg-amber-50 text-amber-700';
  }

  imageSource(name: string) {
    return name || 'https://placehold.co/600x400/e2e8f0/64748b?text=Brilliant+Archery';
  }

  fallbackImage(event: Event) {
    (event.target as HTMLImageElement).src = 'https://placehold.co/600x400/e2e8f0/64748b?text=Brilliant+Archery';
  }
}
