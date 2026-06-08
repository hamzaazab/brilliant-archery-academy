import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  username = 'admin';
  password = '';
  error = '';
  loading = false;

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  submit() {
    this.error = '';
    this.loading = true;

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/admin/users');
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        if (error.status === 0) {
          this.error = 'تعذر الاتصال بالخادم. تحقق من تشغيل الباك إند وقاعدة البيانات.';
          return;
        }

        if (error.status === 401) {
          this.error = 'بيانات الدخول غير صحيحة.';
          return;
        }

        this.error = 'حدث خطأ غير متوقع أثناء تسجيل الدخول.';
      }
    });
  }
}
