import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminUser, AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
  admins: AdminUser[] = [];
  username = '';
  password = '';
  confirmPassword = '';
  loading = false;
  loadingAdmins = true;
  success = '';
  error = '';

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  ngOnInit(): void {
    this.loadAdmins();
  }

  loadAdmins() {
    const token = this.authService.getToken();
    if (!token) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.loadingAdmins = true;
    this.authService.getAdmins(token).subscribe({
      next: (response) => {
        this.admins = response.admins;
        this.loadingAdmins = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loadingAdmins = false;
        this.error = error.status === 401 ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة اخرى.' : 'تعذر تحميل قائمة المشرفين.';
      }
    });
  }

  submit() {
    this.success = '';
    this.error = '';

    if (!this.username.trim() || !this.password.trim()) {
      this.error = 'اسم المستخدم وكلمة المرور مطلوبان.';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'كلمة المرور يجب ان تكون 6 احرف على الاقل.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'تأكيد كلمة المرور غير مطابق.';
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.loading = true;

    this.authService.createAdmin(this.username.trim(), this.password, token).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'تم إنشاء المشرف بنجاح.';
        this.username = '';
        this.password = '';
        this.confirmPassword = '';
        this.loadAdmins();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;

        if (error.status === 409) {
          this.error = 'اسم المستخدم مستخدم بالفعل.';
          return;
        }

        if (error.status === 401 || error.status === 403) {
          this.error = 'غير مصرح لك بهذه العملية. يرجى تسجيل الدخول مرة اخرى.';
          return;
        }

        this.error = 'تعذر إضافة المشرف. حاول مرة اخرى.';
      }
    });
  }
}
