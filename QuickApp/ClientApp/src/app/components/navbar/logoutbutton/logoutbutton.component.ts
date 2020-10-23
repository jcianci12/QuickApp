import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-logoutbutton',
  templateUrl: './logoutbutton.component.html',
  styleUrls: ['./logoutbutton.component.scss']
})
export class LogoutbuttonComponent implements OnInit {

  constructor(    
    private authService: AuthService,
    ) { }

  ngOnInit(): void {
  }
  logout() {
    this.authService.logout();
    this.authService.redirectLogoutUser();
  }
}
