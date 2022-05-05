import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogInAppComponent } from './log-in-app.component';

describe('LogInAppComponent', () => {
  let component: LogInAppComponent;
  let fixture: ComponentFixture<LogInAppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LogInAppComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogInAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
