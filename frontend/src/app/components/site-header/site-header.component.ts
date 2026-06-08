import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './site-header.component.html'
})
export class SiteHeaderComponent {
  constructor(public readonly authService: AuthService, private readonly router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/home');
  }

  hideBrokenLogo(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
