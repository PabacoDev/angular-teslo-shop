import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthResponse } from '@auth/interfaces/auth-response.interface';
import { User } from '@auth/interfaces/user.interface';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment.development';

type AuthStatus = 'checking' | 'authenticated' | 'non-authenticated';
const baseUrl = environment.baseUrl;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authStatus = signal<AuthStatus>('checking');
  private user = signal<User | null>(null);
  private token = signal<string | null>(localStorage.getItem('token'));

  private http = inject(HttpClient);

  checkStatusResource = rxResource({
    loader: () => this.checkStatus(),
  });

  authStat = computed<AuthStatus>(() => {
    if (this.authStatus() == 'checking') return 'checking';
    if (this.user()) {
      return 'authenticated';
    }
    return 'non-authenticated';
  });

  usuario = computed(() => this.user());
  clave = computed(this.token);
  isAdmin = computed(() => this.user()?.roles.includes('admin') ?? false);

  login(email: string, password: string): Observable<boolean> {
    return this.http
      .post<AuthResponse>(`${baseUrl}/auth/login`, {
        email: email,
        password: password,
      })
      .pipe(
        map((resp) => this.handleAuthSuccess(resp)),
        tap(() => console.log(`${baseUrl}`)),
        catchError((error: any) => this.handleAuthError(error))
      );
  }

  register(
    email: string,
    password: string,
    userName: string
  ): Observable<boolean> {
    return this.http
      .post<AuthResponse>(`${baseUrl}/auth/register`, {
        email: email,
        password: password,
        fullName: userName,
      })
      .pipe(
        map((resp) => this.handleAuthSuccess(resp)),
        catchError((error: any) => this.handleAuthError(error))
      );
  }

  checkStatus(): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (token == null) {
      this.logout();
      return of(false);
    }

    return this.http
      .get<AuthResponse>(`${baseUrl}/auth/check-status`, {
        // headers: {
        //   Authorization: `Bearer ${token}`,
        // },
      })
      .pipe(
        map((resp) => this.handleAuthSuccess(resp)),
        tap(() =>
          console.log(`url: ${baseUrl} \n authStatus: ${this.authStatus()}`)
        ),
        catchError((error: any) => this.handleAuthError(error))
      );
  }

  logout() {
    this.user.set(null);
    this.token.set(null);
    this.authStatus.set('non-authenticated');
    localStorage.removeItem('token');
  }

  private handleAuthSuccess(resp: AuthResponse) {
    this.authStatus.set('authenticated');
    this.user.set(resp.user);
    this.token.set(resp.token);
    localStorage.setItem('token', resp.token);
    return true;
  }

  private handleAuthError(error: any) {
    this.logout();
    return of(false);
  }
}
