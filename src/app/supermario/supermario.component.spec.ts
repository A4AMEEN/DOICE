import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupermarioComponent } from './supermario.component';

describe('SupermarioComponent', () => {
  let component: SupermarioComponent;
  let fixture: ComponentFixture<SupermarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SupermarioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SupermarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
