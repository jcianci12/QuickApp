import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarbuttonComponent } from './navbarbutton.component';

describe('NavbarbuttonComponent', () => {
  let component: NavbarbuttonComponent;
  let fixture: ComponentFixture<NavbarbuttonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NavbarbuttonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarbuttonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
