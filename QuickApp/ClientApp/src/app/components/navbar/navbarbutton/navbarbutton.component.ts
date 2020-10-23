import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: '[app-navbarbutton]',
  templateUrl: './navbarbutton.component.html',
  styleUrls: ['./navbarbutton.component.scss']
})
export class NavbarbuttonComponent implements OnInit {
@Input() path:string;
@Input() text:string;
@Input() icon:string;
  constructor() { }

  ngOnInit(): void {
  }

}
