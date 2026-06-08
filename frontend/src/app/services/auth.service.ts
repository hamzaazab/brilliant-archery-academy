import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs/operators';

interface LoginResponse {
  token: string;
  username: string;
}

export interface AdminUser {
  username: string;
  createdAt: string;
}

interface AdminListResponse {
  admins: AdminUser[];
}

interface CreateAdminResponse {
  message: string;
  admin: AdminUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBase = 'http://localhost:3000/api';
  private readonly tokenKey = 'baa_admin_token';
  readonly isAuthenticated = signal<boolean>(!!localStorage.getItem(this.tokenKey));

  constructor(private readonly http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post<LoginResponse>(`${this.apiBase}/auth/login`, { username, password }).pipe(
      tap((res) => {
        localStorage.setItem(this.tokenKey, res.token);
        this.isAuthenticated.set(true);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.isAuthenticated.set(false);
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  getAdmins(token: string) {
    return this.http.get<AdminListResponse>(`${this.apiBase}/admin/admins`, { headers: this.authHeaders(token) });
  }

  createAdmin(username: string, password: string, token: string) {
    return this.http.post<CreateAdminResponse>(
      `${this.apiBase}/admin/admins`,
      { username, password },
      { headers: this.authHeaders(token) }
    );
  }

  private authHeaders(token: string) {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
